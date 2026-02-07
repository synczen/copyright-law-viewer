// 조문 인터페이스 - JSON 구조와 일치
export interface Article {
    id: string;
    number: string;
    title: string;
    content: string;
    chapter: string;
    section: string;
    relatedDecree: string[];
    relatedRule: string[];
}

// 절 인터페이스
export interface Section {
    number: string;
    title: string;
}

// 장 인터페이스
export interface Chapter {
    id: string;
    number: string;
    title: string;
    sections: Section[];
}

// 법률 인터페이스 - JSON 구조와 일치
export interface Law {
    id: string;
    name: string;
    englishName: string;
    lawType: 'law' | 'decree' | 'rule';
    lawNumber: string;
    enactDate: string;
    lastModified: string;
    description: string;
    chapters: Chapter[];
    articles: Article[];
}

// 3단 비교용 조문 정보
export interface ComparisonArticle {
    id: string;
    number: string;
    title: string;
    content: string;
}

// 3단 비교 인터페이스 - JSON 구조와 일치
export interface TripleComparison {
    lawArticle: ComparisonArticle;
    decreeArticles: ComparisonArticle[];
    ruleArticles: ComparisonArticle[];
}

// 전체 데이터 인터페이스
export interface LawData {
    laws: Law[];
    tripleComparisons: TripleComparison[];
}
