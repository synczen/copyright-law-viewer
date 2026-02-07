import { Link } from "wouter";

export default function NotFound() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-6">페이지를 찾을 수 없습니다</p>
                <Link href="/">
                    <a className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        홈으로 돌아가기
                    </a>
                </Link>
            </div>
        </div>
    );
}
