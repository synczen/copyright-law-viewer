import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Law } from "@/types/law";

interface LawSearchProps {
    laws: Law[];
    onArticleSelect: (articleNumber: string, lawId?: string) => void;
}

export default function LawSearch({ laws, onArticleSelect }: LawSearchProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // 모든 법률의 조문을 평탄화
    const allArticles = useMemo(() => {
        return laws.flatMap(law =>
            law.articles.map(article => ({
                ...article,
                lawId: law.id,
                lawName: law.name,
                lawType: law.lawType,
            }))
        );
    }, [laws]);

    // 검색 결과 필터링
    const searchResults = useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        return allArticles
            .filter(article =>
                article.number.includes(query) ||
                article.title.toLowerCase().includes(lowerQuery) ||
                article.content?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 10); // 최대 10개 결과
    }, [query, allArticles]);

    const handleSelect = (articleNumber: string, lawId: string) => {
        onArticleSelect(articleNumber, lawId);
        setQuery("");
        setIsOpen(false);
    };

    const getLawTypeBadgeClass = (lawType: string) => {
        switch (lawType) {
            case 'law': return 'bg-blue-100 text-blue-800';
            case 'decree': return 'bg-amber-100 text-amber-800';
            case 'rule': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="relative">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="조문 번호 또는 제목 검색..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* 검색 결과 드롭다운 */}
            {isOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {searchResults.map(article => (
                        <button
                            key={`${article.lawId}-${article.id}`}
                            onClick={() => handleSelect(article.number, article.lawId)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getLawTypeBadgeClass(article.lawType)}`}>
                                    {article.lawType === 'law' ? '법' : article.lawType === 'decree' ? '령' : '규칙'}
                                </span>
                                <span className="font-medium text-sm text-gray-900">{article.number}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 truncate">{article.title}</p>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 text-center text-sm text-gray-500">
                    검색 결과가 없습니다
                </div>
            )}
        </div>
    );
}
