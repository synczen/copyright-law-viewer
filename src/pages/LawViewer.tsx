import { useEffect, useState } from "react";
import { Menu, X, Link2 } from "lucide-react";
import LawNavigation from "@/components/LawNavigation";
import LawSearch from "@/components/LawSearch";
import ArticleContent from "@/components/ArticleContent";
import { Law, LawData, Article } from "@/types/law";

export default function LawViewer() {
    const [laws, setLaws] = useState<Law[]>([]);
    const [selectedLawId, setSelectedLawId] = useState<string>("copyright_law");
    const [selectedArticleId, setSelectedArticleId] = useState<string>("1");
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [explLanguage, setExplLanguage] = useState<'en' | 'ko'>('en');

    useEffect(() => {
        async function loadData() {
            try {
                const [lawsRes, berneRes] = await Promise.all([
                    fetch('./laws.json'),
                    fetch('./berne.json')
                ]);
                const lawsData: LawData = await lawsRes.json();

                try {
                    const berneData: Law = await berneRes.json();
                    setLaws([...lawsData.laws, berneData]);
                } catch (e) {
                    console.warn("Berne data failed via fetch, loading separately or error:", e);
                    setLaws(lawsData.laws);
                }


            } catch (error) {
                console.error("법률 데이터 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const getSelectedArticle = (): Article | null => {
        const law = laws.find(l => l.id === selectedLawId);
        if (!law) return null;
        return law.articles.find(a => a.id === selectedArticleId) || null;
    };

    const getDecreeArticles = (relatedIds: string[]): Article[] => {
        const decree = laws.find(l => l.id === "copyright_decree");
        if (!decree || !relatedIds.length) return [];
        return decree.articles.filter(a => relatedIds.includes(a.id));
    };

    const getRuleArticles = (relatedIds: string[]): Article[] => {
        const rule = laws.find(l => l.id === "copyright_rule");
        if (!rule || !relatedIds.length) return [];
        return rule.articles.filter(a => relatedIds.includes(a.id));
    };



    const selectedArticle = getSelectedArticle();
    const selectedLaw = laws.find(l => l.id === selectedLawId);

    const isMainLaw = selectedLawId === "copyright_law";
    const decreeArticles = selectedArticle && isMainLaw ? getDecreeArticles(selectedArticle.relatedDecree || []) : [];
    const ruleArticles = selectedArticle && isMainLaw ? getRuleArticles(selectedArticle.relatedRule || []) : [];
    const hasRelated = decreeArticles.length > 0 || ruleArticles.length > 0;

    const handleLawSelect = (lawId: string) => {
        setSelectedLawId(lawId);
        const law = laws.find(l => l.id === lawId);
        if (law && law.articles.length > 0) {
            setSelectedArticleId(law.articles[0].id);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900">
            {/* 모바일 햄버거 메뉴 버튼 */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* 좌측 네비게이션 */}
            <div
                className={`
                    fixed md:static inset-y-0 left-0 z-40
                    w-72 md:w-72
                    border-r border-gray-200 bg-white
                    overflow-y-auto flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 space-y-3">
                    <div>
                        <h1 className="text-xl font-bold text-blue-900">저작권법 3단 비교</h1>
                        <p className="text-xs text-gray-500 mt-1">법률 → 시행령 → 시행규칙</p>
                    </div>
                    {!isLoading && (
                        <LawSearch
                            laws={laws}
                            onArticleSelect={(articleNumber: string, lawId?: string) => {
                                if (lawId) {
                                    setSelectedLawId(lawId);
                                    const law = laws.find(l => l.id === lawId);
                                    const article = law?.articles.find(a => a.number === articleNumber);
                                    if (article) {
                                        setSelectedArticleId(article.id);
                                    }
                                } else {
                                    const mainLaw = laws.find(l => l.id === "copyright_law");
                                    const article = mainLaw?.articles.find(a => a.number === articleNumber);
                                    if (article) {
                                        setSelectedLawId("copyright_law");
                                        setSelectedArticleId(article.id);
                                    }
                                }
                                setIsMobileMenuOpen(false);
                            }}
                        />
                    )}
                </div>
                {isLoading ? (
                    <div className="p-4 text-center text-gray-500">로딩 중...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <LawNavigation
                            laws={laws}
                            selectedLawId={selectedLawId}
                            selectedArticleId={selectedArticleId}
                            onLawSelect={handleLawSelect}
                            onArticleSelect={(articleId) => {
                                setSelectedArticleId(articleId);
                                setIsMobileMenuOpen(false);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* 모바일 오버레이 배경 */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* 중앙 콘텐츠 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 상단 정보 바 */}
                {selectedArticle && (
                    <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-3">
                        <span className="text-sm text-gray-500">{selectedLaw?.name}</span>
                        <span className="font-bold text-gray-900">{selectedArticle.number}</span>
                        <span className="text-gray-600">({selectedArticle.title})</span>
                        {isMainLaw && hasRelated && (
                            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded ml-auto">
                                <Link2 size={12} />
                                관련 조문
                            </span>
                        )}
                        {selectedArticle.chapter && (
                            <span className="text-xs text-gray-400 ml-auto">
                                {selectedArticle.chapter}
                                {selectedArticle.section && ` > ${selectedArticle.section}`}
                            </span>
                        )}
                    </div>
                )}

                {/* 콘텐츠 영역 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-500">데이터 로딩 중...</p>
                            </div>
                        </div>
                    ) : selectedArticle ? (
                        isMainLaw ? (
                            /* 저작권법: 3단 비교 뷰 */
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* 저작권법 */}
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="border-l-4 border-blue-600 p-4">
                                        <ArticleContent
                                            content={selectedArticle.content}
                                            articleNumber={selectedArticle.number}
                                            articleTitle={selectedArticle.title}
                                            lawName="저작권법"
                                            lawType="law"
                                        />
                                    </div>
                                </div>

                                {/* 시행령 */}
                                <div className="space-y-4">
                                    {decreeArticles.length > 0 ? (
                                        decreeArticles.map(article => (
                                            <div key={article.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                                <div className="border-l-4 border-amber-600 p-4">
                                                    <ArticleContent
                                                        content={article.content}
                                                        articleNumber={article.number}
                                                        articleTitle={article.title}
                                                        lawName="시행령"
                                                        lawType="decree"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
                                            <span className="text-gray-400 text-sm">관련 시행령 조문 없음</span>
                                        </div>
                                    )}
                                </div>

                                {/* 시행규칙 */}
                                <div className="space-y-4">
                                    {ruleArticles.length > 0 ? (
                                        ruleArticles.map(article => (
                                            <div key={article.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                                <div className="border-l-4 border-green-600 p-4">
                                                    <ArticleContent
                                                        content={article.content}
                                                        articleNumber={article.number}
                                                        articleTitle={article.title}
                                                        lawName="시행규칙"
                                                        lawType="rule"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
                                            <span className="text-gray-400 text-sm">관련 시행규칙 조문 없음</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : selectedLaw?.lawType === 'convention' ? (
                            /* 베른협약: 3단 뷰 (영문/국문/해설) */
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* English */}
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="border-l-4 border-blue-600 p-4">
                                        <h3 className="font-bold mb-2 text-blue-900">Original Text (English)</h3>
                                        <ArticleContent
                                            content={selectedArticle.content_en || selectedArticle.content || ''}
                                            articleNumber={selectedArticle.number}
                                            articleTitle={selectedArticle.title}
                                            lawName="Berne Convention"
                                            lawType="convention"
                                        />
                                    </div>
                                </div>
                                {/* Korean */}
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="border-l-4 border-purple-600 p-4">
                                        <h3 className="font-bold mb-2 text-purple-900">Korean Translation</h3>
                                        <ArticleContent
                                            content={selectedArticle.content_ko || ''}
                                            articleNumber={selectedArticle.number}
                                            articleTitle={selectedArticle.title}
                                            lawName="베른협약 (국문)"
                                            lawType="convention"
                                        />
                                    </div>
                                </div>
                                {/* Explanation */}
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="border-l-4 border-green-600 p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-green-900">Explanation</h3>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setExplLanguage('en')}
                                                    className={`text-xs px-2 py-1 rounded transition-colors ${explLanguage === 'en' ? 'bg-green-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >
                                                    English
                                                </button>
                                                <button
                                                    onClick={() => setExplLanguage('ko')}
                                                    className={`text-xs px-2 py-1 rounded transition-colors ${explLanguage === 'ko' ? 'bg-green-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                >
                                                    한국어
                                                </button>
                                            </div>
                                        </div>
                                        <ArticleContent
                                            content={explLanguage === 'en' ? (selectedArticle.content_expl || '') : (selectedArticle.content_expl_ko || '해당 조문의 해설 번역본이 없습니다.')}
                                            articleNumber={selectedArticle.number}
                                            articleTitle={selectedArticle.title}
                                            lawName="해설"
                                            lawType="convention"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* 시행령/시행규칙: 단일 조문 뷰 */
                            <div className="max-w-4xl">
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className={`border-l-4 ${selectedLawId === 'copyright_decree' ? 'border-amber-600' : 'border-green-600'} p-6`}>
                                        <ArticleContent
                                            content={selectedArticle.content}
                                            articleNumber={selectedArticle.number}
                                            articleTitle={selectedArticle.title}
                                            lawName={selectedLaw?.name || ''}
                                            lawType={selectedLawId === 'copyright_decree' ? 'decree' : 'rule'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">조문을 선택하세요</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
