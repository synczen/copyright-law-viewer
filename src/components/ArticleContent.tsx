import React from "react";

interface ArticleContentProps {
    content: string;
    articleNumber: string;
    articleTitle: string;
    lawName: string;
    lawType: 'law' | 'decree' | 'rule';
    onArticleClick?: (articleNumber: string) => void;
}

export default function ArticleContent({
    content,
    articleNumber,
    articleTitle,
    lawName,
    lawType,
    onArticleClick
}: ArticleContentProps) {
    // 1. 외부 법령 참조 패턴 (「식품위생법 시행령」 제21조제8호)
    // 그룹 1: 전체, 그룹 2: 법령명, 그룹 3: 조문번호(선택)
    const externalLawPattern = /(「([^」]+)」(?:\s*(제\d+조(?:의\d+)?(?:제\d+항)?(?:제\d+호)?(?:의\d+)?))?)/g;

    // 2. 내부 조문 참조 패턴 (제1조, 제25조제1항, 법 제35조 등)
    // 외부 법령 패턴에 매칭되지 않은 나머지 중에서 찾음
    const articleRefPattern = /((?:법|령|규칙|이 법|이 영|이 규칙)?\s*제\d+조(?:의\d+)?(?:제\d+항)?(?:제\d+호)?(?:의\d+)?)/g;

    // 3. 개정 이력 패턴
    const amendmentPattern = /(<(?:개정|신설|삭제|본조신설|제목개정)\s*[^>]+>)/g;

    // 법률 타입별 색상
    const getColors = () => {
        switch (lawType) {
            case 'law': return { badge: 'bg-blue-100 text-blue-800', link: 'text-blue-600 hover:text-blue-800' };
            case 'decree': return { badge: 'bg-amber-100 text-amber-800', link: 'text-amber-600 hover:text-amber-800' };
            case 'rule': return { badge: 'bg-green-100 text-green-800', link: 'text-green-600 hover:text-green-800' };
        }
    };
    const colors = getColors();

    const parseContent = (text: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        // 정규식 결합 (주의: 순서 중요. 외부 법령이 내부 조문보다 먼저 매칭되어야 함)
        // 1: 외부법령(전체), 2: 법령명, 3: 조문번호
        // 4: 내부조문
        // 5: 개정이력
        const combinedPattern = new RegExp(
            `(${externalLawPattern.source})|(${articleRefPattern.source})|(${amendmentPattern.source})`,
            'g'
        );

        let match;
        while ((match = combinedPattern.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            const fullMatch = match[0];

            if (match[1]) {
                // 1. 외부 법령 참조
                const lawRefName = match[2]; // 괄호 안 법령명 (예: 식품위생법 시행령)
                const articleRef = match[3]; // 조문 번호 (예: 제21조제8호) - 없을 수도 있음

                const cleanLawName = lawRefName.replace(/\s+/g, ''); // 공백 제거
                let href = `https://www.law.go.kr/법령/${cleanLawName}`;
                if (articleRef) {
                    href += `/${articleRef.trim()}`;
                }

                parts.push(
                    <a
                        key={`ex-${match.index}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 underline decoration-1 underline-offset-2 decoration-indigo-300"
                        title="국가법령정보센터에서 보기"
                    >
                        {fullMatch}
                    </a>
                );
            } else if (match[4]) {
                // 2. 내부 조문 참조
                parts.push(
                    <a
                        key={`ref-${match.index}`}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (onArticleClick) {
                                const numMatch = fullMatch.match(/제\d+조(?:의\d+)?/);
                                if (numMatch) {
                                    onArticleClick(numMatch[0]);
                                }
                            }
                        }}
                        className={`${colors.link} underline decoration-1 underline-offset-2`}
                    >
                        {fullMatch}
                    </a>
                );
            } else if (match[5]) {
                // 3. 개정 이력
                parts.push(
                    <span key={`amend-${match.index}`} className="text-gray-400 text-xs">
                        {fullMatch}
                    </span>
                );
            }

            lastIndex = match.index + fullMatch.length;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts;
    };

    const renderContent = (): React.ReactNode => {
        const lines = content.split('\n').filter(line => line.trim());

        return (
            <div className="text-sm leading-relaxed text-gray-800">
                {lines.map((line, idx) => {
                    const trimmedLine = line.trim();
                    const isFirst = idx === 0;

                    const headerSpan = isFirst ? (
                        <span className="mr-2 inline-block">
                            <span className="text-xs text-gray-500 mr-1">{lawName}</span>
                            <span className="font-bold text-gray-900">{articleNumber}</span>
                            <span className="font-bold text-gray-900">({articleTitle})</span>
                        </span>
                    ) : null;

                    const paragraphMatch = trimmedLine.match(/^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/);
                    const itemMatch = trimmedLine.match(/^(\d+)\.\s*/);
                    const subItemMatch = trimmedLine.match(/^([가나다라마바사아자차카타파하])\.\s*/);

                    if (paragraphMatch) {
                        return (
                            <p key={idx} className="mt-2 first:mt-0">
                                {headerSpan}
                                <span className={`inline-block ${colors.badge} text-xs font-bold px-1.5 py-0.5 rounded mr-1`}>
                                    {paragraphMatch[1]}
                                </span>
                                {parseContent(trimmedLine.slice(1))}
                            </p>
                        );
                    } else if (itemMatch) {
                        return (
                            <div key={idx} className={`relative pl-6 mt-1 ${isFirst ? 'first:mt-0' : ''}`}>
                                {isFirst && <div className="mb-1 -ml-6">{headerSpan}</div>}
                                <span className="absolute left-0 text-gray-600 font-medium">{itemMatch[1]}.</span>
                                <div>{parseContent(trimmedLine.slice(itemMatch[0].length))}</div>
                            </div>
                        );
                    } else if (subItemMatch) {
                        return (
                            <div key={idx} className={`relative pl-12 mt-0.5 ${isFirst ? 'first:mt-0' : ''}`}>
                                {isFirst && <div className="mb-1 -ml-12">{headerSpan}</div>}
                                <span className="absolute left-6 text-gray-500">{subItemMatch[1]}.</span>
                                <div>{parseContent(trimmedLine.slice(subItemMatch[0].length))}</div>
                            </div>
                        );
                    } else {
                        return (
                            <p key={idx} className="mt-2 first:mt-0">
                                {headerSpan}
                                {parseContent(trimmedLine)}
                            </p>
                        );
                    }
                })}
            </div>
        );
    };

    return (
        <div className="article-content">
            {renderContent()}
        </div>
    );
}
