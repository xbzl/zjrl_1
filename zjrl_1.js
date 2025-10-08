// zjrl_fixed.js -- 修复：拦截 api.rc-backup.com /v1/subscribers/*，即使 304/空 body 也返回有效会员
(function () {
  const url = $request.url || "";
  // 只处理 subscribers 相关的响应
  if (!url.includes("/v1/subscribers/")) {
    $done({ body: $response && $response.body ? $response.body : "" });
    return;
  }

  const now = new Date();
  const request_date = now.toISOString();
  const request_date_ms = now.getTime();

  // 你可以根据需要修改 productId / entitlementId
  const productId = "com.byronyeung.cuckoo.Annual";
  const entitlementId = "Pro";
  const expires = "2999-12-31T23:59:59Z";

  // 构造的长期有效 subscriber 结构（基于 RevenueCat 返回结构）
  const fakeSubscriber = {
    request_date_ms: request_date_ms,
    request_date: request_date,
    subscriber: {
      non_subscriptions: {},
      first_seen: request_date,
      original_application_version: "2",
      other_purchases: {},
      management_url: "https://apps.apple.com/account/subscriptions",
      subscriptions: {},
      entitlements: {},
      original_purchase_date: request_date,
      // 用一个占位 original_app_user_id（可留为空或从原响应合并）
      original_app_user_id: "$RCAnonymousID:fixed",
      last_seen: request_date
    }
  };

  fakeSubscriber.subscriber.subscriptions[productId] = {
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
    display_name: null,
    billing_issues_detected_at: null,
    ownership_type: "PURCHASED",
    store: "app_store",
    auto_resume_date: null
  };

  fakeSubscriber.subscriber.entitlements[entitlementId] = {
    expires_date: expires,
    product_identifier: productId,
    purchase_date: request_date
  };

  // 如果是 offerings（例如 /subscribers/{id}/offerings），我们尽量保持原 body 并只调整 current_offering_id（保险做法）
  if (url.includes("/offerings")) {
    try {
      let body = $response && $response.body ? JSON.parse($response.body) : {};
      // 如果没有 current_offering_id，就填一个常见 id（HAR 中见到 annual_05_only）
      if (!body.current_offering_id) body.current_offering_id = "annual_05_only";
      // 也可注入 product id 映射（谨慎修改）
      $done({ body: JSON.stringify(body) });
      return;
    } catch (e) {
      // 解析失败就返回原始响应（或返回一个简单的 offerings）
      $done({ body: $response && $response.body ? $response.body : "{}" });
      return;
    }
  }

  // 其它 subscribers 请求（包含 304 / 空 body）：直接返回我们构造的长期有效 subscriber
  try {
    // 如果原响应是合法 JSON，我们仍然把 subscriber 字段替换为我们的假数据（保留其它字段）
    if ($response && $response.body) {
      let original = {};
      try { original = JSON.parse($response.body); } catch (e) { original = {}; }
      original.request_date = fakeSubscriber.request_date;
      original.request_date_ms = fakeSubscriber.request_date_ms;
      original.subscriber = fakeSubscriber.subscriber;
      $done({ body: JSON.stringify(original) });
      return;
    }
  } catch (e) {
    // 如果上面流程失败，退回到直接返回 fake
  }
  $done({ body: JSON.stringify(fakeSubscriber) });
})();
