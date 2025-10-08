// Surge 脚本：拦截追剧日历订阅接口，始终返回已激活会员状态
let url = $request.url;
if (url.includes("/v1/subscribers/") && !url.includes("/offerings")) {
    // 构造虚假订阅信息：置所有产品有效到很远的将来
    let subscriber = {
        "request_date": new Date().toISOString(),
        "subscriber": {
            "non_subscriptions": {},
            "first_seen": "2021-01-01T00:00:00Z",
            "original_app_user_id": "zjrl_user",
            "subscriptions": {
                // 使用应用中的产品 ID，例如 Annual 订阅
                "com.byronyeung.cuckoo.Annual": {
                    "billing_issues_detected_at": null,
                    "expires_date": "2099-12-31T23:59:59Z",
                    "is_sandbox": false,
                    "original_purchase_date": "2021-01-01T00:00:00Z",
                    "purchase_date": "2021-01-01T00:00:00Z"
                }
            },
            "entitlements": {
                // 假设产品对应的付费功能标识为 "Pro" 或其它
                "Pro": {
                    "expires_date": "2099-12-31T23:59:59Z",
                    "product_identifier": "com.byronyeung.cuckoo.Annual",
                    "purchase_date": "2021-01-01T00:00:00Z",
                    "will_renew": false,
                    "unsubscribe_detected_at": null,
                    "billing_issues_detected_at": null,
                    "is_sandbox": false,
                    "period_type": "normal",
                    "ownership_type": "PURCHASED"
                }
            }
        }
    };
    $done({body: JSON.stringify(subscriber)});
} else if (url.includes("/v1/subscribers/") && url.includes("/offerings")) {
    // 保持原样返回套餐列表，不必修改
    $done({body: $response.body});
} else {
    // 其它请求不处理
    $done({body: $response.body});
}
