# EN 版 Privacy / Terms / 確認メール 下書き

W3「英語版の付帯物 → 利用規約・プライバシーポリシー・確認メールの英訳」のドラフト。

kiko が目を通して OK を出したら:
- Privacy / Terms は `PrivacyContent.tsx` / `TermsContent.tsx` に locale prop を足して差し込む
- 確認メールは Supabase Dashboard → Auth → Email Templates に貼る (JA / EN どちらを出すかは今の運用だと言語検出なしで JA のみ。Dashboard は1テンプレだけ持てる。別対応案は末尾に)

---

## 1) Privacy Policy (EN)

```
Privacy Policy
Effective: April 2026 · Last updated: September 2026

1. Operator
Operator: RootLink
Contact: rootlink.japan@gmail.com

2. Information We Collect
We collect the following information:
- Email address and display name (when you create an account)
- Google / GitHub account information (when you use social login)
- Learning history, saved words, study results, and other usage data
- Search queries (sent to the OpenAI API to generate dictionary data)
- IP address, browser information, and access logs (collected automatically)
- Payment information (Stripe for the web, App Store / Google Play for the apps — we never receive or store your card number)
- Purchase and subscription status (sent to RevenueCat to manage in-app purchases)

3. How We Use Your Information
- Providing, operating, and improving the service
- User authentication and account management
- Storing and displaying your learning data
- Billing and payment processing
- Preventing abuse and keeping the service secure
- Sending maintenance notices and other important announcements
- Responding to inquiries

4. Third-Party Services
We use the following third-party services. Information is handled under each service's own privacy policy.

| Service | Purpose |
| --- | --- |
| Supabase | Authentication and database |
| OpenAI | Dictionary data and translation generation |
| Stripe | Payment processing (web) |
| RevenueCat | In-app purchase management and subscription state |
| Apple (App Store) | In-app purchase processing (iOS) |
| Google (Google Play) | In-app purchase processing (Android) |
| Google | Social login |
| GitHub | Social login |
| Vercel | Web hosting |
| Google Cloud Run | API server hosting |

5. Cookies
We use cookies to keep you signed in. You can disable cookies in your browser settings, but some features may stop working.

6. Data Storage and Management
Collected data is stored in Supabase (AWS Tokyo region). We encrypt data in transit via HTTPS and use Row Level Security to control access.
You can delete your account at any time from Settings → "Delete account" after signing in. On deletion:
- Account data (email, display name, avatar), saved words and phrases, study results, streaks, and all other learning history are deleted immediately.
- Any active Premium subscription is cancelled at the same time.
- Residual data in backups and access logs is fully erased within 30 days.
- Payment records on Stripe and the app stores (App Store / Google Play) are retained under each provider's privacy policy and applicable tax law.

7. Your Rights
You have the following rights regarding the personal data we hold about you:
- Request disclosure
- Request correction, addition, or deletion
- Request suspension of use or erasure
- Request suspension of third-party disclosure

To exercise these rights, contact us via the inquiry form or at rootlink.japan@gmail.com.

8. Minors
This service is intended for users aged 13 or older. Users under 13 are not permitted.

9. Changes to This Policy
We may revise this policy as needed. We will announce material changes within the service. Continued use after a revision constitutes acceptance of the revised policy.

10. Contact
Operator: RootLink
Email: rootlink.japan@gmail.com
```

---

## 2) Terms of Service (EN)

```
Terms of Service
Effective: June 2026 · Last updated: June 2026

1. Operator
Operator: RootLink
Contact: rootlink.japan@gmail.com

2. Service Overview
RootLink ("the Service") is an English-vocabulary learning app built around word roots. It offers a free plan and a Premium plan.

3. Accounts
- Using the Service requires an account registered with an email address.
- You are responsible for safeguarding your own account credentials.
- We may suspend an account without prior notice if abuse is detected.

4. Pricing and Billing
- Premium costs ¥500 / month (tax included) or ¥4,800 / year (tax included). USD / other local prices are shown at checkout.
- On the web, payments are processed by Stripe. We do not retain card information.
- Monthly plans renew every month; annual plans renew every year, automatically.
- You can cancel at any time. After cancellation, you keep access until the end of the current billing period.

5. Refund Policy
- Monthly plan: full refund if requested within 7 days of purchase.
- Annual plan: full refund if requested within 14 days of purchase.
- After these windows, refunds are not provided as a rule.
- For refund requests, contact rootlink.japan@gmail.com.

6. Prohibited Conduct
- Reusing, reproducing, or reselling the Service's content without permission
- Unauthorized access or reverse engineering of the Service
- Harassment of other users
- Any other conduct that violates applicable law or public order

7. Disclaimers
- The Service is provided as-is. We make no guarantee of learning outcomes.
- We are not liable for service interruptions due to system failures, maintenance, or similar causes.
- We do not guarantee the completeness or accuracy of dictionary or etymology data.

8. Changes to and Termination of the Service
We may change or discontinue the Service with prior notice. If the Service is discontinued, we will refund the remaining paid period.

9. Governing Law and Jurisdiction
These Terms are governed by Japanese law. Any dispute will be submitted to the Tokyo District Court as the court of first instance with exclusive jurisdiction.

10. Changes to These Terms
We may revise these Terms as needed. We will announce material changes within the Service. Continued use after a revision constitutes acceptance of the revised Terms.
```

---

## 3) Signup OTP Email (EN)

Supabase の Email Template の中で、サインアップ時に送られる OTP 認証メール用。
Dashboard → Auth → Email Templates → **Confirm signup** を置き換える想定。

### Subject
```
Your RootLink verification code
```

### Body (HTML)
```html
<h2>Welcome to RootLink</h2>
<p>Thanks for signing up. Enter this code in the app to finish creating your account:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:2px;margin:24px 0;">{{ .Token }}</p>
<p>This code expires in 1 hour. If you didn't request it, you can safely ignore this email.</p>
<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;">
<p style="font-size:12px;color:#6b7280;">RootLink · <a href="https://www.rootlink.app">rootlink.app</a></p>
```

### Body (text version, for plain-text clients)
```
Welcome to RootLink.

Enter this code in the app to finish creating your account:

{{ .Token }}

This code expires in 1 hour. If you didn't request it, you can safely ignore this email.

— RootLink
https://www.rootlink.app
```

---

## 4) Password Reset Email (EN)

Dashboard → Auth → Email Templates → **Reset password** 用。

### Subject
```
Reset your RootLink password
```

### Body (HTML)
```html
<h2>Reset your password</h2>
<p>We received a request to reset your RootLink password. Click the link below to choose a new one:</p>
<p style="margin:24px 0;">
  <a href="{{ .ConfirmationURL }}" style="background:#009487;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Reset password</a>
</p>
<p>If you didn't request this, you can safely ignore this email — your password will stay the same.</p>
<p style="font-size:12px;color:#6b7280;">The link expires in 1 hour.</p>
<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;">
<p style="font-size:12px;color:#6b7280;">RootLink · <a href="https://www.rootlink.app">rootlink.app</a></p>
```

---

## 5) Email Change Confirmation (EN)

Dashboard → Auth → Email Templates → **Change email address** 用。

### Subject
```
Confirm your new RootLink email
```

### Body (HTML)
```html
<h2>Confirm your new email</h2>
<p>You asked to change your RootLink account email. Enter this code in the app to confirm the change:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:2px;margin:24px 0;">{{ .Token }}</p>
<p>If you didn't request this change, please contact us immediately at rootlink.japan@gmail.com — your current email is still in place.</p>
<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;">
<p style="font-size:12px;color:#6b7280;">RootLink · <a href="https://www.rootlink.app">rootlink.app</a></p>
```

---

## 配信時の EN/JA 切替について

Supabase の Email Template は Dashboard 上で **1言語 1テンプレ** しか持てない。
運用の選択肢:

1. **当面 EN 単一化** (今の i18n 方針とは逆行するが運用コストゼロ)
   - メール本文に `This email is sent in English for all users. If you prefer Japanese, please let us know.` 的な一行だけ入れて逃げる
2. **JA / EN を交互併記** (バイリンガルテンプレ)
   - 上半分 EN / 下半分 JA、など
3. **Edge Function で自前送信に切替** (本命)
   - profiles.display_locale を見て適切な言語の内容を送る
   - Supabase の `signUp` 側の confirm メールを無効化し、Edge Function で自前の verify flow を回す
   - 工数大。W3 では間に合わない可能性

**現実解**: W3 までは「2」のバイリンガル併記で出す。確定前にどれでいくか kiko 判断。

---

## 未確定の確認事項 (kiko 判断)

1. USD 価格を Terms に入れたい? (今は "USD / other local prices are shown at checkout" だけで逃げている)
2. 法令準拠 (日本法 / 東京地裁) は英語版でも同じでOK?  → 原則 OK。日本法人として国内から配信するため
3. 返金窓口は日本語メールでいい? (返答が日本語で届く旨をどこかに書いておきたい?)
4. バイリンガルメール vs EN 単一化 — どちらで W3 を終わらせる?
