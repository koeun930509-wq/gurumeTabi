import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import AccountActions from "../components/AccountActions";
import { IconUserCircle, IconEdit, IconChevronRight, IconFileText, IconShield, IconClose } from "../components/icons";
import { useAuth } from "../context/AuthContext";

function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange} className={`w-11 h-6 rounded-full relative transition-colors flex-none ${checked ? "bg-status-open" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

const POLICY_CONTENT = {
  privacy: {
    title: "개인정보처리방침",
    body: [
      "Gurume Tabi(이하 '회사')는 이용자의 개인정보를 중요시하며, 관련 법령을 준수하기 위해 노력합니다. 본 방침은 예시 화면 구성을 위한 더미 텍스트입니다.",
      "1. 수집하는 개인정보 항목: 이메일 주소, 스크랩 목록, 검색 기록\n2. 수집 목적: 서비스 제공 및 맞춤 추천, 부정 이용 방지\n3. 보유 및 이용 기간: 회원 탈퇴 시까지",
      "실제 서비스 운영 시에는 법무 검토를 거친 정식 개인정보처리방침으로 대체되어야 합니다.",
    ],
  },
  terms: {
    title: "이용약관",
    body: [
      "본 약관은 Gurume Tabi(이하 '서비스')의 이용 조건 및 절차를 규정함을 목적으로 합니다. 본 방침은 예시 화면 구성을 위한 더미 텍스트입니다.",
      "제1조(목적) 이 약관은 서비스 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정합니다.\n제2조(이용 제한) 이용자는 서비스를 부정한 목적으로 사용할 수 없습니다.",
      "실제 서비스 운영 시에는 법무 검토를 거친 정식 이용약관으로 대체되어야 합니다.",
    ],
  },
};

function PolicyModal({ policy, onClose }) {
  if (!policy || !POLICY_CONTENT[policy]) return null;
  const { title, body } = POLICY_CONTENT[policy];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-brand-peach/40">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex flex-col gap-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

const RECENT_SEARCHES = ["오사카 스시", "도톤보리 라멘", "타코야키"];

function RecentSearchesModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-brand-peach/40">
          <h3 className="text-lg font-bold text-gray-900">최근 검색어</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-2">
          {RECENT_SEARCHES.map((term, i) => (
            <div key={i} className="text-sm font-semibold text-gray-700 bg-gray-50 rounded-xl px-3.5 py-2.5">
              {term}
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 text-xs text-gray-400">예시 화면용 더미 데이터입니다. 실제 검색 기록 저장은 백엔드 연동 시 구현 예정입니다.</div>
      </div>
    </div>
  );
}

function PasswordModal({ open, onClose }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSubmitted(false);
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-brand-peach/40">
          <h3 className="text-lg font-bold text-gray-900">비밀번호 변경</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-gray-600">비밀번호가 변경되었어요.</p>
            <button
              onClick={handleClose}
              className="mt-1 bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl cursor-pointer"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">현재 비밀번호</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border border-[#ddd] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-navy"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">새 비밀번호</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border border-[#ddd] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-navy"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">새 비밀번호 확인</label>
              <input
                type="password"
                required
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="border border-[#ddd] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-navy"
              />
            </div>
            {error && <div className="text-sm text-status-soldout">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-1.5 w-full bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white text-sm font-bold py-3 rounded-xl hover:brightness-105 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? "변경 중..." : "변경하기"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const AVATAR_MAX_BYTES = 500 * 1024;
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function NicknameModal({ open, currentNickname, currentAvatar, onSave, onSaveAvatar, onClose }) {
  const [nickname, setNickname] = useState(currentNickname);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar ?? null);
  const [avatarError, setAvatarError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNickname(currentNickname);
      setAvatarPreview(currentAvatar ?? null);
      setAvatarError("");
    }
  }, [open, currentNickname, currentAvatar]);

  if (!open) return null;

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setAvatarError("jpg, png, webp 파일만 업로드할 수 있어요.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("500KB 이하 파일만 업로드할 수 있어요.");
      return;
    }

    setAvatarError("");
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      await onSave(nickname.trim());
      onSaveAvatar(avatarPreview);
      onClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-brand-peach/40">
          <h3 className="text-lg font-bold text-gray-900">프로필 수정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-brand-peach flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="프로필 사진 미리보기" className="w-full h-full object-cover" />
              ) : (
                <IconUserCircle className="w-9 h-9 text-brand-navy" />
              )}
            </div>
            <label className="text-xs font-semibold text-brand-navy cursor-pointer hover:underline">
              사진 변경
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-gray-400">jpg · png · webp, 500KB 이하</span>
            {avatarError && <span className="text-[11px] text-status-soldout">{avatarError}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">닉네임</label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="border border-[#ddd] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-navy"
            />
          </div>
          {saveError && <div className="text-sm text-status-soldout">{saveError}</div>}
          <button
            type="submit"
            disabled={saving}
            className="mt-1.5 w-full bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white text-sm font-bold py-3 rounded-xl hover:brightness-105 transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MyPage() {
  const { user, logout, updateNickname, updateAvatar, scrapIds } = useAuth();
  const navigate = useNavigate();
  const [notifyOn, setNotifyOn] = useState(true);
  const [reviewAlertOn, setReviewAlertOn] = useState(false);
  const [policyModal, setPolicyModal] = useState(null);
  const displayName = user ? user.nickname || user.email.split("@")[0] : "게스트";

  function handleWithdraw() {
    if (window.confirm("정말 탈퇴하시겠습니까? 탈퇴 시 모든 데이터가 삭제됩니다.")) {
      logout();
      navigate("/");
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar active="mypage" />

      <div className="relative flex-1 flex flex-col min-w-0 h-full">
        <div className="md:hidden">
          <Header active="mypage" />
        </div>

        {/* 데스크톱 — 계정 아이콘을 Header와 동일한 위치·크기로, 콘텐츠 위에 겹쳐서 배치 */}
        <div className="absolute top-0 right-0 z-20 hidden md:flex items-center gap-6 px-4 sm:px-6 py-6">
          <AccountActions />
        </div>

        <div className="flex-1 min-h-0 overflow-y-scroll pretty-scroll">
        {/* 모바일 레이아웃 */}
        <div className="md:hidden max-w-md w-full p-6 pb-0 flex flex-col gap-6">
          <h1 className="font-bold text-lg text-brand-navy">마이페이지</h1>

          {/* 프로필 */}
          <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-peach flex items-center justify-center flex-none overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="프로필 사진" className="w-full h-full object-cover" />
              ) : (
                <IconUserCircle className="w-8 h-8 text-brand-navy" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-base font-bold truncate">{displayName}</span>
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
            <h4 className="text-sm tracking-wider text-gray-400 font-sans mb-2.5">활동</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/scrap")}
                className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-3.5 text-center cursor-pointer"
              >
                <div className="text-xl font-extrabold text-brand-navy">{scrapIds.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">스크랩</div>
              </button>
              <button
                onClick={() => setPolicyModal("recentSearch")}
                className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-3.5 text-center cursor-pointer"
              >
                <div className="text-xl font-extrabold text-brand-navy">3</div>
                <div className="text-xs text-gray-500 mt-0.5">최근 검색</div>
              </button>
            </div>
          </section>

          {/* 설정 · 알림 */}
          <section>
            <h4 className="text-sm tracking-wider text-gray-400 font-sans mb-2.5">설정 · 알림</h4>
            <div className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] divide-y divide-brand-peach/40 overflow-hidden">
              <div className="flex items-center justify-between p-3.5">
                <span className="text-base font-semibold">전체 알림</span>
                <Toggle checked={notifyOn} onChange={() => setNotifyOn((v) => !v)} />
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div className="flex flex-col">
                  <span className="text-base font-semibold">새 리뷰 업데이트 알림</span>
                  <span className="text-xs text-gray-400">스크랩에 새 리뷰가 등록되면 알림</span>
                </div>
                <Toggle checked={reviewAlertOn} onChange={() => setReviewAlertOn((v) => !v)} />
              </div>
            </div>
          </section>

          {/* 설정 · 계정 */}
          <section>
            <h4 className="text-sm tracking-wider text-gray-400 font-sans mb-2.5">설정 · 계정</h4>
            <div className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] divide-y divide-brand-peach/40 overflow-hidden">
              {user && (
                <button
                  onClick={() => setPolicyModal("nickname")}
                  className="w-full flex items-center gap-1.5 text-left p-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <IconEdit className="w-4 h-4" />
                  프로필 수정
                </button>
              )}
              <button onClick={() => setPolicyModal("password")} className="w-full text-left p-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">비밀번호 변경</button>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="w-full text-left p-3.5 text-base font-semibold text-status-soldout hover:bg-gray-50 cursor-pointer"
                >
                  로그아웃
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full text-left p-3.5 text-base font-semibold text-brand-navy hover:bg-gray-50 cursor-pointer"
                >
                  로그인
                </button>
              )}
              <button onClick={handleWithdraw} className="w-full text-left p-3.5 text-base font-semibold text-gray-400 hover:bg-gray-50 cursor-pointer">회원 탈퇴</button>
            </div>
          </section>

          {/* 정보 */}
          <section>
            <h4 className="text-sm tracking-wider text-gray-400 font-sans mb-2.5">정보</h4>
            <div className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] divide-y divide-brand-peach/40 overflow-hidden">
              <button onClick={() => setPolicyModal("terms")} className="w-full text-left p-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">이용약관</button>
              <button onClick={() => setPolicyModal("privacy")} className="w-full text-left p-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">개인정보처리방침</button>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-sm font-semibold text-gray-400">앱 버전</span>
                <span className="text-xs text-gray-400">v0.1.0 (뼈대)</span>
              </div>
            </div>
          </section>

          <Footer className="text-center text-white pt-3 pb-4" />
        </div>

        {/* PC 레이아웃 */}
        <div className="hidden md:flex flex-col w-full p-8 pb-0 gap-6">
          <h1 className="font-bold text-2xl text-gray-900">마이페이지</h1>

          {/* 계정 정보 */}
          <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-6 flex flex-col gap-4">
            <h4 className="text-base font-bold text-gray-900">계정 정보</h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-peach flex items-center justify-center flex-none overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="프로필 사진" className="w-full h-full object-cover" />
                ) : (
                  <IconUserCircle className="w-9 h-9 text-brand-navy" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-lg font-bold truncate">{displayName}</span>
                <span className="text-xs text-gray-400 truncate">{user ? user.email : "로그인하지 않은 상태예요"}</span>
              </div>
              {user ? (
                <button
                  onClick={() => setPolicyModal("nickname")}
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy border border-brand-peach rounded-full px-4 py-2 hover:bg-brand-peach/30 flex-none cursor-pointer"
                >
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
                    <span className="text-xs text-gray-400">스크랩에서 새 리뷰가 등록되면 알림을 받습니다.</span>
                  </div>
                  <Toggle checked={reviewAlertOn} onChange={() => setReviewAlertOn((v) => !v)} />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-5">
              <h4 className="text-base font-bold text-gray-900 mb-3">계정 설정</h4>
              <div className="divide-y divide-brand-peach/40">
                <button onClick={() => setPolicyModal("password")} className="w-full flex items-center justify-between py-3.5 text-left hover:bg-gray-50 cursor-pointer">
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
                    className="w-full flex items-center justify-between py-3.5 text-left hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-status-soldout">로그아웃</span>
                      <span className="text-xs text-gray-400">현재 계정에서 로그아웃합니다.</span>
                    </div>
                    <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
                  </button>
                ) : (
                  <button onClick={() => navigate("/login")} className="w-full flex items-center justify-between py-3.5 text-left hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm font-semibold text-brand-navy">로그인</span>
                    <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
                  </button>
                )}
                <button onClick={handleWithdraw} className="w-full flex items-center justify-between py-3.5 text-left hover:bg-gray-50 cursor-pointer">
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
                <button onClick={() => navigate("/scrap")} className="text-center px-2 cursor-pointer">
                  <div className="text-xs text-gray-500 mb-2">스크랩</div>
                  <div className="text-2xl font-extrabold text-brand-navy">
                    {scrapIds.length}
                    <span className="text-sm font-semibold text-gray-400 ml-0.5">개</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">내가 스크랩한 맛집 수</div>
                </button>
                <button onClick={() => setPolicyModal("recentSearch")} className="text-center px-2 cursor-pointer">
                  <div className="text-xs text-gray-500 mb-2">최근 검색</div>
                  <div className="text-2xl font-extrabold text-brand-navy">
                    3<span className="text-sm font-semibold text-gray-400 ml-0.5">회</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">최근 검색한 횟수</div>
                </button>
              </div>
            </section>
          </div>

          {/* 이용약관 및 정책 */}
          <section className="bg-white rounded-2xl shadow-[0_8px_24px_-10px_rgba(109,40,217,0.25)] p-5">
            <h4 className="text-base font-bold text-gray-900 mb-2">이용약관 및 정책</h4>
            <div className="divide-y divide-brand-peach/40">
              <button onClick={() => setPolicyModal("privacy")} className="w-full flex items-center gap-4 py-4 text-left hover:bg-gray-50 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-brand-peach flex items-center justify-center flex-none">
                  <IconFileText className="w-5 h-5 text-brand-navy" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900">개인정보처리방침</span>
                  <span className="text-xs text-gray-400">개인정보 수집 및 이용에 대한 안내</span>
                </div>
                <IconChevronRight className="w-4 h-4 text-gray-300 flex-none" />
              </button>
              <button onClick={() => setPolicyModal("terms")} className="w-full flex items-center gap-4 py-4 text-left hover:bg-gray-50 cursor-pointer">
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

          <Footer className="text-center text-white pt-3 pb-4" />
        </div>
        </div>
      </div>

      <PolicyModal policy={policyModal} onClose={() => setPolicyModal(null)} />
      <PasswordModal open={policyModal === "password"} onClose={() => setPolicyModal(null)} />
      <NicknameModal
        open={policyModal === "nickname"}
        currentNickname={displayName}
        currentAvatar={user?.avatar}
        onSave={updateNickname}
        onSaveAvatar={updateAvatar}
        onClose={() => setPolicyModal(null)}
      />
      <RecentSearchesModal open={policyModal === "recentSearch"} onClose={() => setPolicyModal(null)} />
    </div>
  );
}
