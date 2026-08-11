import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { IconUserCircle, IconEdit, IconChevronRight, IconFileText, IconShield, IconBell } from "../components/icons";
import { useAuth } from "../context/AuthContext";

function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange} className={`w-11 h-6 rounded-full relative transition-colors flex-none ${checked ? "bg-status-open" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function MyPage() {
  const { user, logout, savedIds } = useAuth();
  const navigate = useNavigate();
  const [notifyOn, setNotifyOn] = useState(true);
  const [reviewAlertOn, setReviewAlertOn] = useState(false);

  return (
    <div className="min-h-full flex">
      <Sidebar active="mypage" />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
          <Header active="mypage" />
        </div>

        {/* 모바일 레이아웃 */}
        <div className="md:hidden max-w-md w-full p-6 flex flex-col gap-6">
          <h1 className="font-bold text-lg text-brand-navy">마이페이지</h1>

          {/* 프로필 */}
          <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-peach flex items-center justify-center flex-none">
              <IconUserCircle className="w-8 h-8 text-brand-navy" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-base font-bold truncate">{user ? user.email.split("@")[0] : "게스트"}</span>
              <span className="text-sm text-gray-400 truncate">{user ? user.email : "로그인하지 않은 상태예요"}</span>
              {!user && (
                <button
                  onClick={() => navigate("/login")}
                  className="mt-1.5 self-start bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_4px_10px_-2px_rgba(126,34,206,0.5)]"
                >
                  로그인하기
                </button>
              )}
            </div>
          </section>

          {/* 활동 */}
          <section>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">활동</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-3.5 text-center">
                <div className="text-xl font-extrabold text-brand-navy">{savedIds.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">저장한 맛집</div>
              </div>
              <div className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-3.5 text-center">
                <div className="text-xl font-extrabold text-brand-navy">3</div>
                <div className="text-xs text-gray-500 mt-0.5">최근 검색</div>
              </div>
            </div>
          </section>

          {/* 설정 · 알림 */}
          <section>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">설정 · 알림</h4>
            <div className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] divide-y divide-brand-peach/40 overflow-hidden">
              <div className="flex items-center justify-between p-3.5">
                <span className="text-base font-semibold">전체 알림</span>
                <Toggle checked={notifyOn} onChange={() => setNotifyOn((v) => !v)} />
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div className="flex flex-col">
                  <span className="text-base font-semibold">새 리뷰 업데이트 알림</span>
                  <span className="text-xs text-gray-400">저장한 맛집에 새 리뷰가 등록되면 알림</span>
                </div>
                <Toggle checked={reviewAlertOn} onChange={() => setReviewAlertOn((v) => !v)} />
              </div>
            </div>
          </section>

          {/* 설정 · 계정 */}
          <section>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">설정 · 계정</h4>
            <div className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] divide-y divide-brand-peach/40 overflow-hidden">
              <button className="w-full text-left p-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50">비밀번호 변경</button>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="w-full text-left p-3.5 text-base font-semibold text-status-soldout hover:bg-gray-50"
                >
                  로그아웃
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full text-left p-3.5 text-base font-semibold text-brand-navy hover:bg-gray-50"
                >
                  로그인
                </button>
              )}
              <button className="w-full text-left p-3.5 text-base font-semibold text-gray-400 hover:bg-gray-50">회원 탈퇴</button>
            </div>
          </section>

          {/* 정보 */}
          <section>
            <h4 className="text-[11px] tracking-wider text-gray-400 font-mono mb-2.5">정보</h4>
            <div className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] divide-y divide-brand-peach/40 overflow-hidden">
              <button className="w-full text-left p-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50">이용약관</button>
              <button className="w-full text-left p-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50">개인정보처리방침</button>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-sm font-semibold text-gray-400">앱 버전</span>
                <span className="text-xs text-gray-400">v0.1.0 (뼈대)</span>
              </div>
            </div>
          </section>
        </div>

        {/* PC 레이아웃 */}
        <div className="hidden md:flex flex-col w-full p-8 gap-6">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-2xl text-gray-900">마이페이지</h1>
            <div className="flex items-center gap-4">
              <button className="text-gray-500 hover:text-brand-navy">
                <IconBell className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 계정 정보 */}
          <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-6 flex flex-col gap-4">
            <h4 className="text-base font-bold text-gray-900">계정 정보</h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-peach flex items-center justify-center flex-none">
                <IconUserCircle className="w-9 h-9 text-brand-navy" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-lg font-bold truncate">{user ? user.email.split("@")[0] : "게스트"}</span>
                <span className="text-xs text-gray-400 truncate">{user ? user.email : "로그인하지 않은 상태예요"}</span>
              </div>
              {user ? (
                <button className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy border border-brand-peach rounded-full px-4 py-2 hover:bg-brand-peach/30 flex-none">
                  <IconEdit className="w-4 h-4" />
                  프로필 수정
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="flex-none bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white text-sm font-bold px-4 py-2 rounded-full shadow-[0_4px_10px_-2px_rgba(126,34,206,0.5)]"
                >
                  로그인하기
                </button>
              )}
            </div>
          </section>

          {/* 알림 설정 · 계정 설정 · 검색 통계 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-5">
              <h4 className="text-base font-bold text-gray-900 mb-3">알림 설정</h4>
              <div className="divide-y divide-brand-peach/40">
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">전체 알림</span>
                    <span className="text-xs text-gray-400">모든 알림을 받습니다.</span>
                  </div>
                  <Toggle checked={notifyOn} onChange={() => setNotifyOn((v) => !v)} />
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">새 리뷰 업데이트 알림</span>
                    <span className="text-xs text-gray-400">저장한 맛집에서 새 리뷰가 등록되면 알림을 받습니다.</span>
                  </div>
                  <Toggle checked={reviewAlertOn} onChange={() => setReviewAlertOn((v) => !v)} />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-5">
              <h4 className="text-base font-bold text-gray-900 mb-3">계정 설정</h4>
              <div className="divide-y divide-brand-peach/40">
                <button className="w-full flex items-center justify-between py-3.5 text-left hover:bg-gray-50">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-700">비밀번호 변경</span>
                    <span className="text-xs text-gray-400">비밀번호를 안전하게 관리하세요.</span>
                  </div>
                  <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
                </button>
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="w-full flex items-center justify-between py-3.5 text-left hover:bg-gray-50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-status-soldout">로그아웃</span>
                      <span className="text-xs text-gray-400">현재 계정에서 로그아웃합니다.</span>
                    </div>
                    <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
                  </button>
                ) : (
                  <button onClick={() => navigate("/login")} className="w-full flex items-center justify-between py-3.5 text-left hover:bg-gray-50">
                    <span className="text-sm font-semibold text-brand-navy">로그인</span>
                    <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
                  </button>
                )}
                <button className="w-full flex items-center justify-between py-3.5 text-left hover:bg-gray-50">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-400">회원 탈퇴</span>
                    <span className="text-xs text-gray-400">회원 탈퇴 및 모든 데이터를 삭제합니다.</span>
                  </div>
                  <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
                </button>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-5 flex flex-col">
              <h4 className="text-base font-bold text-gray-900 mb-3">검색 통계</h4>
              <div className="flex-1 grid grid-cols-2 divide-x divide-brand-peach/40 items-center">
                <div className="text-center px-2">
                  <div className="text-xs text-gray-500 mb-2">저장한 맛집</div>
                  <div className="text-2xl font-extrabold text-brand-navy">
                    {savedIds.length}
                    <span className="text-sm font-semibold text-gray-400 ml-0.5">개</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">내가 저장한 맛집 수</div>
                </div>
                <div className="text-center px-2">
                  <div className="text-xs text-gray-500 mb-2">최근 검색</div>
                  <div className="text-2xl font-extrabold text-brand-navy">
                    3<span className="text-sm font-semibold text-gray-400 ml-0.5">회</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">최근 검색한 횟수</div>
                </div>
              </div>
            </section>
          </div>

          {/* 이용약관 및 정책 */}
          <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-5">
            <h4 className="text-base font-bold text-gray-900 mb-2">이용약관 및 정책</h4>
            <div className="divide-y divide-brand-peach/40">
              <button className="w-full flex items-center gap-4 py-4 text-left hover:bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-brand-peach flex items-center justify-center flex-none">
                  <IconFileText className="w-5 h-5 text-brand-navy" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900">개인정보처리방침</span>
                  <span className="text-xs text-gray-400">개인정보 수집 및 이용에 대한 안내</span>
                </div>
                <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
              </button>
              <button className="w-full flex items-center gap-4 py-4 text-left hover:bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-brand-peach flex items-center justify-center flex-none">
                  <IconShield className="w-5 h-5 text-brand-navy" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900">이용약관</span>
                  <span className="text-xs text-gray-400">서비스 이용에 대한 약관 안내</span>
                </div>
                <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
              </button>
            </div>
            <div className="flex items-center justify-between pt-4 mt-1 border-t border-brand-peach/40">
              <span className="text-sm font-semibold text-gray-500">앱 버전</span>
              <span className="text-xs text-gray-400">v0.1.0 (뼈대)</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
