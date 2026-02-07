# -*- coding: utf-8 -*-
"""
저작권법, 시행령, 시행규칙 TXT 파일을 파싱하여 laws.json 생성
"""

import json
import re
import os

def parse_articles(content, law_type):
    """조문을 파싱하여 articles 리스트 반환"""
    articles = []
    lines = content.split('\n')
    
    current_article = None
    current_content = []
    current_chapter = ""
    current_section = ""
    
    # 장/절 패턴
    chapter_pattern = re.compile(r'^\s*제(\d+)장\s+(.+?)\s*$')
    section_pattern = re.compile(r'^\s*제(\d+)절\s+(.+?)\s*$')
    subsection_pattern = re.compile(r'^\s*제(\d+)관\s+(.+?)\s*$')
    
    # 조문 패턴: 제1조, 제2조의2, 제101조의7 등
    article_pattern = re.compile(r'^제(\d+조(?:의\d+)?)\(([^)]+)\)')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 장 확인
        chapter_match = chapter_pattern.match(line)
        if chapter_match:
            current_chapter = f"제{chapter_match.group(1)}장"
            current_section = ""
            continue
        
        # 절 확인
        section_match = section_pattern.match(line)
        if section_match:
            current_section = f"제{section_match.group(1)}절"
            continue
        
        # 관 확인
        subsection_match = subsection_pattern.match(line)
        if subsection_match:
            # 관은 절의 하위이므로 절에 포함
            continue
        
        # 조문 시작 확인
        article_match = article_pattern.match(line)
        if article_match:
            # 이전 조문 저장
            if current_article:
                article_content = '\n'.join(current_content).strip()
                # 개정 이력 제거 (옵션)
                articles.append({
                    "id": current_article["id"],
                    "number": current_article["number"],
                    "title": current_article["title"],
                    "content": article_content,
                    "chapter": current_article["chapter"],
                    "section": current_article.get("section", ""),
                    "relatedDecree": [],
                    "relatedRule": []
                })
            
            # 새 조문 시작
            article_num = article_match.group(1)
            article_title = article_match.group(2)
            
            # ID 정규화 (제1조 -> 1, 제2조의2 -> 2-2)
            id_num = article_num.replace("조", "").replace("의", "-")
            
            current_article = {
                "id": id_num,
                "number": f"제{article_num}",
                "title": article_title,
                "chapter": current_chapter,
                "section": current_section
            }
            
            # 조문 제목 이후 내용
            content_after_title = line[article_match.end():].strip()
            current_content = [content_after_title] if content_after_title else []
        else:
            # 조문 내용 계속
            if current_article:
                current_content.append(line)
    
    # 마지막 조문 저장
    if current_article:
        article_content = '\n'.join(current_content).strip()
        articles.append({
            "id": current_article["id"],
            "number": current_article["number"],
            "title": current_article["title"],
            "content": article_content,
            "chapter": current_article["chapter"],
            "section": current_article.get("section", ""),
            "relatedDecree": [],
            "relatedRule": []
        })
    
    return articles

def parse_chapters(content):
    """장/절 구조 파싱"""
    chapters = []
    lines = content.split('\n')
    
    chapter_pattern = re.compile(r'^\s*제(\d+)장\s+(.+?)\s*$')
    section_pattern = re.compile(r'^\s*제(\d+)절\s+(.+?)\s*$')
    
    current_chapter = None
    current_sections = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        chapter_match = chapter_pattern.match(line)
        if chapter_match:
            if current_chapter:
                current_chapter["sections"] = current_sections
                chapters.append(current_chapter)
            current_chapter = {
                "id": f"ch{chapter_match.group(1)}",
                "number": f"제{chapter_match.group(1)}장",
                "title": chapter_match.group(2).strip()
            }
            current_sections = []
            continue
        
        section_match = section_pattern.match(line)
        if section_match:
            current_sections.append({
                "number": f"제{section_match.group(1)}절",
                "title": section_match.group(2).strip()
            })
    
    if current_chapter:
        current_chapter["sections"] = current_sections
        chapters.append(current_chapter)
    
    return chapters

def create_article_mappings(law_articles, decree_articles, rule_articles):
    """법-시행령-시행규칙 간 관련 조문 매핑 생성"""
    mappings = []
    
    # 수동 매핑 정의 (주요 조문 간 관계)
    manual_mappings = [
        # 저작권법 제25조 - 학교교육 목적 이용
        {"lawId": "25", "decreeIds": ["2", "3", "4", "5", "6", "7", "8", "9"], "ruleIds": []},
        # 저작권법 제29조 - 영리를 목적으로 하지 않는 공연
        {"lawId": "29", "decreeIds": ["11"], "ruleIds": ["2"]},
        # 저작권법 제30조 - 사적이용을 위한 복제
        {"lawId": "30", "decreeIds": [], "ruleIds": ["2-2"]},
        # 저작권법 제31조 - 도서관에서의 복제
        {"lawId": "31", "decreeIds": ["12", "13"], "ruleIds": []},
        # 저작권법 제33조 - 시각장애인을 위한 복제
        {"lawId": "33", "decreeIds": ["14", "14-2"], "ruleIds": []},
        # 저작권법 제33조의2 - 청각장애인을 위한 복제
        {"lawId": "33-2", "decreeIds": ["15", "15-2"], "ruleIds": []},
        # 저작권법 제34조 - 방송사업자의 일시적 녹음녹화
        {"lawId": "34", "decreeIds": ["16"], "ruleIds": []},
        # 저작권법 제35조의4 - 문화시설에 의한 복제
        {"lawId": "35-4", "decreeIds": ["16-2", "16-3", "16-4", "16-5", "16-6"], "ruleIds": ["2-3", "2-4", "2-5"]},
        # 저작권법 제50조 - 저작재산권자 불명인 저작물
        {"lawId": "50", "decreeIds": ["18", "19", "20", "21", "22", "23"], "ruleIds": ["3", "4", "5"]},
        # 저작권법 제53조 - 저작권의 등록
        {"lawId": "53", "decreeIds": ["24", "25", "26", "27"], "ruleIds": ["6", "7", "8"]},
        # 저작권법 제55조 - 등록의 절차
        {"lawId": "55", "decreeIds": ["27-2", "27-3", "27-4", "27-5"], "ruleIds": ["6-3", "7-2"]},
        # 저작권법 제56조 - 권리자 등의 인증
        {"lawId": "56", "decreeIds": ["36", "37"], "ruleIds": ["11", "12"]},
        # 저작권법 제75조 - 방송사업자의 실연자에 대한 보상
        {"lawId": "75", "decreeIds": ["38-2"], "ruleIds": []},
        # 저작권법 제101조의7 - 프로그램의 임치
        {"lawId": "101-7", "decreeIds": ["39-2"], "ruleIds": []},
        # 저작권법 제102조 - 온라인서비스제공자의 책임 제한
        {"lawId": "102", "decreeIds": ["39-3"], "ruleIds": []},
        # 저작권법 제103조 - 복제전송의 중단
        {"lawId": "103", "decreeIds": ["40", "41", "42", "43", "44"], "ruleIds": ["13", "14", "15", "16"]},
        # 저작권법 제104조 - 특수한 유형의 온라인서비스제공자
        {"lawId": "104", "decreeIds": ["45", "46"], "ruleIds": ["17"]},
        # 저작권법 제104조의2 - 기술적 보호조치의 무력화 금지
        {"lawId": "104-2", "decreeIds": ["46-2"], "ruleIds": []},
        # 저작권법 제105조 - 저작권위탁관리업 허가
        {"lawId": "105", "decreeIds": ["47", "48", "49"], "ruleIds": ["18", "19", "19-2", "19-3"]},
        # 저작권법 제106조 - 저작권신탁관리업자의 의무
        {"lawId": "106", "decreeIds": ["50", "51", "51-2", "51-3"], "ruleIds": ["20"]},
        # 저작권법 제108조 - 보고
        {"lawId": "108", "decreeIds": ["52", "52-2"], "ruleIds": ["20"]},
        # 저작권법 제109조 - 업무정지
        {"lawId": "109", "decreeIds": ["53"], "ruleIds": []},
        # 저작권법 제111조 - 과징금
        {"lawId": "111", "decreeIds": ["54", "55"], "ruleIds": ["21", "22"]},
        # 저작권법 제112조 - 한국저작권위원회
        {"lawId": "112", "decreeIds": ["56", "57", "57-2", "57-3", "58", "59"], "ruleIds": []},
        # 저작권법 제119조 - 감정
        {"lawId": "119", "decreeIds": ["64"], "ruleIds": []},
        # 저작권법 제133조 - 불법복제물의 수거 폐기
        {"lawId": "133", "decreeIds": ["69", "70", "71"], "ruleIds": ["24", "25"]},
        # 저작권법 제133조의2 - 정보통신망을 통한 불법복제물 삭제명령
        {"lawId": "133-2", "decreeIds": ["72", "72-2", "72-3", "72-4", "72-5"], "ruleIds": ["26", "27"]},
        # 저작권법 제134조 - 저작물의 공정한 이용
        {"lawId": "134", "decreeIds": ["73"], "ruleIds": []},
        # 저작권법 제135조 - 저작재산권 등의 기증
        {"lawId": "135", "decreeIds": ["75", "76"], "ruleIds": ["28", "29", "30"]},
    ]
    
    # ID로 조문 찾기 함수
    def find_article(articles, article_id):
        for article in articles:
            if article["id"] == article_id:
                return article
        return None
    
    # 매핑 적용
    for mapping in manual_mappings:
        law_article = find_article(law_articles, mapping["lawId"])
        if law_article:
            for decree_id in mapping["decreeIds"]:
                decree_article = find_article(decree_articles, decree_id)
                if decree_article:
                    law_article["relatedDecree"].append(decree_id)
                    decree_article["relatedRule"].append(mapping["lawId"])
            
            for rule_id in mapping["ruleIds"]:
                rule_article = find_article(rule_articles, rule_id)
                if rule_article:
                    law_article["relatedRule"].append(rule_id)
    
    # TripleComparison 데이터 생성
    for mapping in manual_mappings:
        law_article = find_article(law_articles, mapping["lawId"])
        if law_article:
            decree_list = []
            rule_list = []
            
            for decree_id in mapping["decreeIds"]:
                decree_article = find_article(decree_articles, decree_id)
                if decree_article:
                    decree_list.append({
                        "id": decree_article["id"],
                        "number": decree_article["number"],
                        "title": decree_article["title"],
                        "content": decree_article["content"][:500] + "..." if len(decree_article["content"]) > 500 else decree_article["content"]
                    })
            
            for rule_id in mapping["ruleIds"]:
                rule_article = find_article(rule_articles, rule_id)
                if rule_article:
                    rule_list.append({
                        "id": rule_article["id"],
                        "number": rule_article["number"],
                        "title": rule_article["title"],
                        "content": rule_article["content"][:500] + "..." if len(rule_article["content"]) > 500 else rule_article["content"]
                    })
            
            if decree_list or rule_list:
                mappings.append({
                    "lawArticle": {
                        "id": law_article["id"],
                        "number": law_article["number"],
                        "title": law_article["title"],
                        "content": law_article["content"][:500] + "..." if len(law_article["content"]) > 500 else law_article["content"]
                    },
                    "decreeArticles": decree_list,
                    "ruleArticles": rule_list
                })
    
    return mappings

def main():
    # 파일 읽기
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    with open(os.path.join(script_dir, '저작권법.txt'), 'r', encoding='utf-8') as f:
        law_content = f.read()
    
    with open(os.path.join(script_dir, '저작권법시행령.txt'), 'r', encoding='utf-8') as f:
        decree_content = f.read()
    
    with open(os.path.join(script_dir, '저작권법시행규칙.txt'), 'r', encoding='utf-8') as f:
        rule_content = f.read()
    
    # 파싱
    print("저작권법 파싱 중...")
    law_articles = parse_articles(law_content, "law")
    law_chapters = parse_chapters(law_content)
    print(f"  - {len(law_articles)}개 조문, {len(law_chapters)}개 장 파싱됨")
    
    print("시행령 파싱 중...")
    decree_articles = parse_articles(decree_content, "decree")
    decree_chapters = parse_chapters(decree_content)
    print(f"  - {len(decree_articles)}개 조문, {len(decree_chapters)}개 장 파싱됨")
    
    print("시행규칙 파싱 중...")
    rule_articles = parse_articles(rule_content, "rule")
    rule_chapters = parse_chapters(rule_content)
    print(f"  - {len(rule_articles)}개 조문, {len(rule_chapters)}개 장 파싱됨")
    
    # 매핑 생성
    print("조문 간 매핑 생성 중...")
    mappings = create_article_mappings(law_articles, decree_articles, rule_articles)
    print(f"  - {len(mappings)}개 매핑 생성됨")
    
    # JSON 데이터 구성
    laws_data = {
        "laws": [
            {
                "id": "copyright_law",
                "name": "저작권법",
                "englishName": "Copyright Act",
                "lawType": "law",
                "lawNumber": "법률 제20841호",
                "enactDate": "1957-01-28",
                "lastModified": "2025-09-26",
                "description": "저작자의 권리와 이에 인접하는 권리를 보호하고 저작물의 공정한 이용을 도모함으로써 문화 및 관련 산업의 향상발전에 이바지함을 목적",
                "chapters": law_chapters,
                "articles": law_articles
            },
            {
                "id": "copyright_decree",
                "name": "저작권법 시행령",
                "englishName": "Enforcement Decree of the Copyright Act",
                "lawType": "decree",
                "lawNumber": "대통령령 제35811호",
                "enactDate": "1957-08-28",
                "lastModified": "2025-10-01",
                "description": "「저작권법」에서 위임된 사항과 그 시행에 필요한 사항을 정함",
                "chapters": decree_chapters,
                "articles": decree_articles
            },
            {
                "id": "copyright_rule",
                "name": "저작권법 시행규칙",
                "englishName": "Enforcement Rules of the Copyright Act",
                "lawType": "rule",
                "lawNumber": "문화체육관광부령 제546호",
                "enactDate": "1987-10-01",
                "lastModified": "2024-05-07",
                "description": "「저작권법」 및 같은 법 시행령에서 위임된 사항과 그 시행에 필요한 사항을 정함",
                "chapters": rule_chapters,
                "articles": rule_articles
            }
        ],
        "tripleComparisons": mappings
    }
    
    # JSON 파일 저장
    output_path = os.path.join(script_dir, 'public', 'laws.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(laws_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nlaws.json 파일 생성 완료: {output_path}")
    print(f"총 조문 수: 저작권법 {len(law_articles)}, 시행령 {len(decree_articles)}, 시행규칙 {len(rule_articles)}")

if __name__ == "__main__":
    main()
