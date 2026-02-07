import { TripleComparison, ComparisonArticle } from "@/types/law";

interface TripleComparisonViewProps {
    comparison: TripleComparison;
}

function ArticleCard({
    article,
    type,
    colorClasses
}: {
    article: ComparisonArticle | null;
    type: string;
    colorClasses: { bg: string; border: string; badge: string };
}) {
    return (
        <div className={`rounded-lg border-l-4 p-6 shadow-sm ${colorClasses.bg} ${colorClasses.border}`}>
            <div className="flex items-center gap-2 mb-4">
                <span className={`text-white px-3 py-1 rounded text-sm font-semibold ${colorClasses.badge}`}>
                    {type}
                </span>
                {article && (
                    <span className="text-sm text-gray-600">{article.number}</span>
                )}
            </div>
            <h4 className="font-medium text-gray-900 mb-2">
                {article?.title || ""}
            </h4>
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                {article?.content || (
                    <span className="text-gray-400 italic">해당 조문 없음</span>
                )}
            </div>
        </div>
    );
}

export default function TripleComparisonView({ comparison }: TripleComparisonViewProps) {
    const colorSchemes = {
        law: { bg: "bg-blue-50", border: "border-blue-600", badge: "bg-blue-600" },
        decree: { bg: "bg-amber-50", border: "border-amber-600", badge: "bg-amber-600" },
        rule: { bg: "bg-green-50", border: "border-green-600", badge: "bg-green-600" },
    };

    return (
        <div className="p-6">
            {/* 조문 헤더 */}
            <div className="mb-8 border-b-2 border-blue-900 pb-6">
                <div className="flex items-center gap-4 mb-2">
                    <span className="inline-block bg-blue-900 text-white px-4 py-2 rounded font-bold text-lg">
                        {comparison.lawArticle?.number}
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-blue-900">{comparison.lawArticle?.title}</h1>
            </div>

            {/* 3단 비교 컨테이너 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 법 */}
                <div className="space-y-4">
                    <ArticleCard
                        article={comparison.lawArticle}
                        type="법"
                        colorClasses={colorSchemes.law}
                    />
                </div>

                {/* 시행령 */}
                <div className="space-y-4">
                    {comparison.decreeArticles && comparison.decreeArticles.length > 0 ? (
                        comparison.decreeArticles.map((article, idx) => (
                            <ArticleCard
                                key={article.id || idx}
                                article={article}
                                type="시행령"
                                colorClasses={colorSchemes.decree}
                            />
                        ))
                    ) : (
                        <ArticleCard
                            article={null}
                            type="시행령"
                            colorClasses={colorSchemes.decree}
                        />
                    )}
                </div>

                {/* 시행규칙 */}
                <div className="space-y-4">
                    {comparison.ruleArticles && comparison.ruleArticles.length > 0 ? (
                        comparison.ruleArticles.map((article, idx) => (
                            <ArticleCard
                                key={article.id || idx}
                                article={article}
                                type="시행규칙"
                                colorClasses={colorSchemes.rule}
                            />
                        ))
                    ) : (
                        <ArticleCard
                            article={null}
                            type="시행규칙"
                            colorClasses={colorSchemes.rule}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
