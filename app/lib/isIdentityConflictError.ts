/**
 * Supabase の auth エラーが「既存アカウントとの衝突」を表しているか判定する。
 *
 * linkIdentity で、既に別ユーザーに紐付いた identity を叩いたとき (identity_already_exists)
 * や、linkIdentity 途中で email が別ユーザーで登録済みと判明したとき (email_exists /
 * "A user with this email address has already been registered") に返るエラーを拾う。
 *
 * 判定ソース:
 *   - error_code: identity_already_exists / email_exists / user_already_exists
 *   - message の正規表現: identity / already / exists / linked / registered を含むもの
 *
 * AppShell.appUrlOpen (deeplink) と /callback の両経路で同じ判定を使うため、
 * 文字列マッチの揺れを 1 箇所に閉じ込める。
 */
export function isIdentityConflictError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as {
    code?: unknown;
    details?: { code?: unknown } | null;
    message?: unknown;
  };
  const code =
    (typeof e.code === "string" ? e.code : "") ||
    (e.details && typeof e.details.code === "string" ? e.details.code : "");
  if (
    code === "identity_already_exists" ||
    code === "email_exists" ||
    code === "user_already_exists"
  ) {
    return true;
  }
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return /identity.*already|already.*(linked|exists|registered)|user.*already.*(exists|registered)/.test(
    msg,
  );
}
