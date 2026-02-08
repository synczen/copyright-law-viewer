import React from "react";

interface ArticleContentProps {
    content: string;
    articleNumber: string;
    articleTitle: string;
    lawName: string;
    lawType: 'law' | 'decree' | 'rule';
}

export default function ArticleContent({
    content,
    articleNumber,
    articleTitle,
    lawName,
    lawType
}: ArticleContentProps) {
    // 1. 외부 법령 참조 패턴 (「식품위생법 시행령」 제21조제8호)
    const externalLawPattern = /(「([^」]+)」(?:\s*(제\d+조(?:의\d+)?(?:제\d+항)?(?:제\d+호)?(?:의\d+)?))?)/g;

    // 2. 내부 조문 참조 패턴 (제1조, 제25조제1항, 법 제35조 등)
    const articleRefPattern = /((?:법|령|규칙|이 법|이 영|이 규칙)?\s*제\d+조(?:의\d+)?(?:제\d+항)?(?:제\d+호)?(?:의\d+)?)/g;

    // 3. 개정 이력 패턴
    const amendmentPattern = /(<(?:개정|신설|삭제|본조신설|제목개정)\s*[^>]+>)/g;

    // 법률 타입별 색상
    const getColors = () => {
        switch (lawType) {
            case 'law': return { badge: 'bg-blue-100 text-blue-800', link: 'text-blue-700 font-bold hover:text-blue-900 visited:text-blue-700' };
            case 'decree': return { badge: 'bg-amber-100 text-amber-800', link: 'text-amber-700 font-bold hover:text-amber-900 visited:text-amber-700' };
            case 'rule': return { badge: 'bg-green-100 text-green-800', link: 'text-green-700 font-bold hover:text-green-900 visited:text-green-700' };
        }
    };
    const colors = getColors();

    // 법령 타입에 따른 국가법령정보센터 URL 파라미터 매핑
    const getLawUrlName = () => {
        switch (lawType) {
            case 'law': return '저작권법';
            case 'decree': return '저작권법시행령';
            case 'rule': return '저작권법시행규칙';
            default: return '저작권법';
        }
    };

    const parseContent = (text: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        const combinedPattern = new RegExp(
            `${externalLawPattern.source}|${articleRefPattern.source}|${amendmentPattern.source}`,
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
                const lawRefName = match[2];
                const articleRef = match[3];

                const cleanLawName = lawRefName.replace(/\s+/g, '');
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
                // 2. 내부 조문 참조 (새창 열기로 변경)
                // "제45조" -> 숫자 추출
                const numMatch = fullMatch.match(/제\d+조(?:의\d+)?/);
                const articleNum = numMatch ? numMatch[0] : '';

                // 국가법령정보센터 URL 생성
                // 예: https://www.law.go.kr/법령/저작권법/제45조
                const lawUrlName = getLawUrlName();
                const href = `https://www.law.go.kr/법령/${lawUrlName}/${articleNum}`;

                parts.push(
                    <a
                        key={`ref-${match.index}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${colors.link} underline decoration-1 underline-offset-2 cursor-pointer`}
                        title="국가법령정보센터에서 보기"
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
