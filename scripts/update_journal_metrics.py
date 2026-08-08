#!/usr/bin/env python3
"""Optional journal-metric updater.

Exact Journal Impact Factor (JIF) values are Clarivate data and there is no
universal free API. If you have a licensed/exported JSON feed, expose its URL as
JCR_JSON_URL. Expected shape:
{"Journal Name":{"impact_factor":6.0,"year":2025,"source":"Clarivate JCR"}, ...}

Without JCR_JSON_URL, the script preserves the last verified values already in
publications.json rather than guessing an IF.
"""
import json, os
from pathlib import Path
import requests
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'data/publications.json'
data=json.loads(p.read_text(encoding='utf-8'))
url=os.getenv('JCR_JSON_URL','').strip()
if url:
    r=requests.get(url,timeout=30); r.raise_for_status(); metrics=r.json()
    for pub in data.get('publications',[]):
        m=metrics.get(pub.get('journal',''))
        if m:
            pub['impact_factor']=m.get('impact_factor')
            pub['impact_factor_year']=m.get('year')
            pub['impact_factor_source']=m.get('source','Clarivate JCR')
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'data/publications.js').write_text('window.LAB_PUBLICATION_DATA = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print('Journal metric update complete')
