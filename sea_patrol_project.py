"""
立创商城大航海计划免费样片抓取脚本
环境变量：
  - LCSC_COOKIE: 立创商城 Cookie
  - VOYAGE_UUID: 项目 UUID
"""

import asyncio
import json
import os
import re
import sys
from typing import Dict, Any, List

import aiohttp
from tqdm.asyncio import tqdm_asyncio

# ---------- 配置 ----------
API_URL = "https://activity.szlcsc.com/itp/voyage/so/async/product/search"
PAGE_SIZE = 10
CONCURRENCY = 3
OUTPUT_JSON = "sea_patrol_project.json"

USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
              "AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/119.0 Safari/537.0")
# --------------------------


def check_env(var_name: str) -> str:
    """检查并获取环境变量，未设置则退出"""
    value = os.environ.get(var_name)
    if not value:
        print(f"::error::环境变量 {var_name} 未设置")
        sys.exit(1)
    return value


def clean_number(value, is_int=True):
    """清洗数字字段"""
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        return int(value) if is_int else float(value)
    if isinstance(value, str):
        nums = re.findall(r'\d+', value)
        if nums:
            return int(nums[0]) if is_int else float(nums[0])
    return 0


async def fetch_catalogs(session: aiohttp.ClientSession, uuid: str) -> List[Dict]:
    """获取分类列表 (catalogGroup)"""
    body = {
        "currentPage": 1,
        "pageSize": PAGE_SIZE,
        "searchType": "default",
        "voyageCustomerProjectUuid": uuid,
    }
    
    try:
        async with session.post(API_URL, json=body, timeout=30) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise RuntimeError(f"HTTP {resp.status}: {text[:200]}")
            
            data = await resp.json()
            catalogs = data.get("result", {}).get("catalogGroup", [])
            
            if not catalogs:
                raise RuntimeError("API 返回的分类列表为空，请检查 Cookie 和 UUID 是否正确")
            
            return catalogs
    except Exception as e:
        print(f"::error::获取分类列表失败: {e}")
        raise


async def fetch_page(
    session: aiohttp.ClientSession,
    catalog_id: str,
    page: int,
    uuid: str,
    semaphore: asyncio.Semaphore
) -> Dict[str, Any]:
    """抓取单页数据"""
    async with semaphore:
        body = {
            "currentPage": page,
            "pageSize": PAGE_SIZE,
            "searchType": "default",
            "catalogIdFilter": catalog_id,
            "voyageCustomerProjectUuid": uuid,
        }
        
        async with session.post(API_URL, json=body, timeout=30) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise RuntimeError(f"HTTP {resp.status} on page {page}: {text[:200]}")
            return await resp.json()


def parse_products(json_data: Dict[str, Any], category: str, data_map: Dict[str, Any]):
    """解析单页产品数据"""
    source_list = json_data.get("result", {}).get("sourceList", [])
    
    for item in source_list:
        vo = item.get("frontProductVO") or {}
        model = vo.get("productModel")
        
        if not model or str(model).lower() == 'nan':
            continue
        
        free_qty = clean_number(vo.get("itpProductNum"), is_int=True)
        min_total = clean_number(vo.get("productMoney"), is_int=False)
        
        data_map[str(model).strip()] = {
            "freeQty": free_qty,
            "minTotal": round(min_total, 2),
            "category": category,
            "brand": str(vo.get("brandName", "")).strip(),
            "encapsulation": str(vo.get("encapsulationModel", "")).strip(),
            "productCode": str(vo.get("productCode", "")).strip(),
            "needNumber": clean_number(vo.get("needNumber"), is_int=True),
            "split": clean_number(vo.get("split"), is_int=True),
            "productPrice": clean_number(vo.get("productPrice"), is_int=False)
        }


async def crawl_category(
    session: aiohttp.ClientSession,
    category_name: str,
    catalog_id: str,
    uuid: str
) -> Dict[str, Any]:
    """抓取单个分类的所有页面"""
    data_map = {}
    semaphore = asyncio.Semaphore(CONCURRENCY)
    
    try:
        # 第一页
        first_page = await fetch_page(session, catalog_id, 1, uuid, semaphore)
        total_pages = first_page.get("result", {}).get("countPage", 0)
        
        if total_pages == 0:
            return data_map
        
        parse_products(first_page, category_name, data_map)
        
        # 剩余页面
        if total_pages > 1:
            pages = list(range(2, total_pages + 1))
            tasks = [fetch_page(session, catalog_id, p, uuid, semaphore) for p in pages]
            
            results = await tqdm_asyncio.gather(
                *tasks, 
                desc=f"{category_name[:10]:<10}", 
                total=len(pages),
                bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}]',
                ncols=80
            )
            
            for page_data in results:
                parse_products(page_data, category_name, data_map)
                
    except Exception as e:
        print(f"::warning::[{category_name}] 抓取失败: {e}")
    
    return data_map


async def main():
    print(f"::group::初始化环境")
    
    # 检查环境变量
    cookie = check_env("LCSC_COOKIE")
    uuid = check_env("VOYAGE_UUID")
    
    # 敏感信息打码输出
    cookie_preview = cookie[:20] + "..." if len(cookie) > 20 else "***"
    print(f"LCSC_COOKIE: {cookie_preview}")
    print(f"VOYAGE_UUID: {uuid[:8]}...")
    
    print(f"::endgroup::")
    
    headers = {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
        "Cookie": cookie,
        "Accept": "application/json, text/plain, */*",
    }
    
    async with aiohttp.ClientSession(headers=headers) as session:
        # 获取分类
        print(f"::group::获取分类列表")
        catalogs = await fetch_catalogs(session, uuid)
        print(f"获取到 {len(catalogs)} 个分类")
        print(f"::endgroup::")
        
        # 抓取数据
        print(f"::group::抓取产品数据")
        final_data = {}
        
        for cat in catalogs:
            label = cat.get("label")
            value = cat.get("value")
            
            if not label or not value:
                continue
            
            category_data = await crawl_category(session, label, value, uuid)
            final_data.update(category_data)
            print(f"{label}: {len(category_data)} 条")
        
        print(f"::endgroup::")
        
        # 写入文件
        print(f"正在写入 {OUTPUT_JSON}...")
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)
        
        # GitHub Actions 输出
        print(f"::set-output name=record_count::{len(final_data)}")
        print(f"完成！共抓取 {len(final_data)} 条记录")
        
        # 验证文件
        if not os.path.exists(OUTPUT_JSON) or os.path.getsize(OUTPUT_JSON) == 0:
            print("::error::文件生成失败或为空")
            sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n用户中断")
        sys.exit(130)
    except Exception as e:
        print(f"::error::程序异常: {e}")
        sys.exit(1)
