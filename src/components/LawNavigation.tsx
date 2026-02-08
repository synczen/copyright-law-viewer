import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Law, Article } from "@/types/law";

interface LawNavigationProps {
    laws: Law[];
    selectedLawId: string;
    selectedArticleId: string;
    onLawSelect: (lawId: string) => void;
    onArticleSelect: (articleId: string, articleNumber: string) => void;
}

export default function LawNavigation({
    laws,
    selectedLawId,
    selectedArticleId,
    onLawSelect,
    onArticleSelect,
}: LawNavigationProps) {
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(["제1장"]));

    const selectedLaw = laws.find(law => law.id === selectedLawId);

    const toggleChapter = (chapterNumber: string) => {
        const newExpanded = new Set(expandedChapters);
        if (newExpanded.has(chapterNumber)) {
            newExpanded.delete(chapterNumber);
        } else {
            newExpanded.add(chapterNumber);
        }
        setExpandedChapters(newExpanded);
    };

    // 법률 타입에 따른 배지 색상
    const getLawTypeBadgeClass = (lawType: string, isSelected: boolean) => {
        if (isSelected) {
            switch (lawType) {
                case 'law': return 'bg-blue-600 text-white';
                case 'decree': return 'bg-amber-600 text-white';
                case 'rule': return 'bg-green-600 text-white';
                default: return 'bg-gray-600 text-white';
            }
        }
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    };

    const getLawTypeLabel = (lawType: string) => {
        switch (lawType) {
            case 'law': return '법';
            case 'decree': return '시행령';
            case 'rule': return '시행규칙';
            default: return '';
        }
    };

    // 장별로 조문 그룹화
    const getArticlesByChapter = (chapter: string): Article[] => {
        if (!selectedLaw) return [];
        return selectedLaw.articles.filter(article => article.chapter === chapter);
    };

    return (
        <div className="p-2">
            {/* 법률 선택 탭 */}
            <div className="flex gap-1 mb-4 flex-wrap">
                {laws.map(law => (
                    <button
                        key={law.id}
                        onClick={() => onLawSelect(law.id)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${getLawTypeBadgeClass(law.lawType, selectedLawId === law.id)}`}
                    >
                        {getLawTypeLabel(law.lawType)}
                    </button>
                ))}
            </div>

            {/* Articles not in any chapter (usually Decree/Rules main body) */}
            {selectedLaw && (
                <div className="border-l border-gray-200 ml-2 mb-4">
                    {selectedLaw.articles
                        .filter(article => !article.chapter)
                        .map(article => (
                            <button
                                key={article.id}
                                onClick={() => onArticleSelect(article.id, article.number)}
                                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${selectedArticleId === article.id
                                    ? 'bg-blue-100 text-blue-800 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className="font-medium">{article.number}</span>
                                <span className="ml-1 text-gray-500">{article.title}</span>
                                {/* 관련 조문 있으면 표시 (저작권법만) */}
                                {selectedLawId === "copyright_law" &&
                                    (article.relatedDecree?.length > 0 || article.relatedRule?.length > 0) && (
                                        <span className="ml-2 text-xs text-blue-500">●</span>
                                    )}
                            </button>
                        ))}
                </div>
            )}

            {/* Chapters (Regular Law Chapters & Supplementary Provisions) */}
            {selectedLaw && selectedLaw.chapters.length > 0 && (
                selectedLaw.chapters.map(chapter => {
                    const chapterArticles = getArticlesByChapter(chapter.number);
                    return (
                        <div key={chapter.id} className="mb-1">
                            <button
                                onClick={() => toggleChapter(chapter.number)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded transition-colors"
                            >
                                {expandedChapters.has(chapter.number) ? (
                                    <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                                ) : (
                                    <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />
                                )}
                                <span className="font-medium text-sm text-gray-800">
                                    {chapter.number} {chapter.title}
                                </span>
                                <span className="text-xs text-gray-400 ml-auto">
                                    {chapterArticles.length}
                                </span>
                            </button>

                            {expandedChapters.has(chapter.number) && chapterArticles.length > 0 && (
                                <div className="ml-6 border-l border-gray-200">
                                    {chapterArticles.map(article => (
                                        <button
                                            key={article.id}
                                            onClick={() => onArticleSelect(article.id, article.number)}
                                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${selectedArticleId === article.id
                                                ? 'bg-blue-100 text-blue-800 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            <span className="font-medium">{article.number}</span>
                                            <span className="ml-1 text-gray-500">{article.title}</span>
                                            {/* 관련 조문 있으면 표시 (저작권법만) */}
                                            {selectedLawId === "copyright_law" &&
                                                (article.relatedDecree?.length > 0 || article.relatedRule?.length > 0) && (
                                                    <span className="ml-2 text-xs text-blue-500">●</span>
                                                )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
