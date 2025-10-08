// zjrl_resp_fix.js -- response-side: 无论原始响应如何，返回/注入长期有效 subscriber
(function () {
  const url = $request.url || "";
  if (!url.includes("api.rc-backup.com/v1/subscribers/")) {
    $done({ body: $response && $response.body ? $response.body : "" });
    return;
  }

  const now = new Date();
  const request_date = now.toISOString();
  const request_date_ms = now.getTime();
  const productId = "com.byronyeung.cuckoo.Annual"; // 可按需改
  const entitlementId = "Pro"; // 可按需改
  const expires = "2999-12-31T23:59:59Z";

  // 构造 fake subscriber
  const fake = {
    request_date_ms: request_date_ms,
    request_date: request_date,
    subscriber: {
      non_subscriptions: {},
      first_seen: request_date,
      original_application_version: "1",
      other_purchases: {},
      management_url: "https://apps.apple.com/account/subscriptions",
      subscriptions: {},
      entitlements: {},
      original_purchase_date: request_date,
      original_app_user_id: "$RCAnonymousID:fixed",
      last_seen: request_date
    }
  };

  fake.subscriber.subscriptions[productId] = {
    original_purchase_date: request_date,
    expires_date: expires,
    is_sandbox: false,
    refunded_at: null,
    store_transaction_id: String(request_date_ms),
    unsubscribe_detected_at: null,
    grace_period_expires_date: null,
    period_type: "normal",
    price: { amount: 0, currency: "CNY" },
    purchase_date: request_date,
    billing_issues_detected_at: null,
    ownership_type: "PURCHASED",
    store: "app_store",
    auto_resume_date: null
  };

  fake.subscriber.entitlements[entitlementId] = {
    expires_date: expires,
    product_identifier: productId,
    purchase_date: request_date
  };

  // 如果是 /offerings，尝试合并原 body 的 offerings（保守处理）
  if (url.includes("/offerings")) {
    try {
      let original = $response && $response.body ? JSON.parse($response.body) : {};
      if (!original.current_offering_id) original.current_offering_id = "annual_05_only";
      // 不破坏原结构的情况下，返回合并体
      $done({ body: JSON.stringify(original) });
      return;
    } catch (e) {
      // 解析失败，继续返回默认 fake（不会影响会员判断）
    }
  }

  // 对 /subscribers/{id} 返回我们 fake 的 subscriber（覆盖）
  $done({ body: JSON.stringify(fake) });
})();
