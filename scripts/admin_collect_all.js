#!/usr/bin/env ts-node
/**
 * 管理者用一括収集バッチスクリプト
 *
 * 使用方法:
 *   npx ts-node scripts/admin_collect_all.ts --mode=test
 *   npx ts-node scripts/admin_collect_all.ts --mode=mhlw --cancerType=colon
 *   npx ts-node scripts/admin_collect_all.ts --mode=all --cancerType=colon
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var RealDataCollectionService = require('../src/lib/services/realDataCollectors').RealDataCollectionService;
var InformationPoolService = require('../src/lib/services/informationPoolService').InformationPoolService;
var _a = require('../src/const/scraping_urls'), TEST_SCRAPING_URLS = _a.TEST_SCRAPING_URLS, generateMHLWUrls = _a.generateMHLWUrls, MANUAL_ADDITIONAL_URLS = _a.MANUAL_ADDITIONAL_URLS;
function parseArgs() {
    var args = process.argv.slice(2);
    var parsed = {
        mode: 'test', // デフォルトは安全なテストモード
        dryRun: false,
        maxUrls: 5 // デフォルトは5件まで（IPブロック防止）
    };
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (arg === '--mode' && args[i + 1]) {
            parsed.mode = args[i + 1];
            i++;
        }
        else if (arg === '--cancerType' && args[i + 1]) {
            parsed.cancerType = args[i + 1];
            i++;
        }
        else if (arg === '--dry-run') {
            parsed.dryRun = true;
        }
        else if (arg === '--max-urls' && args[i + 1]) {
            parsed.maxUrls = parseInt(args[i + 1]);
            i++;
        }
    }
    return parsed;
}
// =============================================================================
// メイン処理
// =============================================================================
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, collectionService, poolService, targetUrls, collectionMode, mhlwUrls, manualUrls, collectedItems, _a, saveResult, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🚀 管理者用一括収集バッチ開始');
                    console.log('='.repeat(60));
                    args = parseArgs();
                    console.log('📋 実行設定:');
                    console.log("  - \u30E2\u30FC\u30C9: ".concat(args.mode));
                    console.log("  - \u304C\u3093\u7A2E: ".concat(args.cancerType || '未指定'));
                    console.log("  - \u30C9\u30E9\u30A4\u30E9\u30F3: ".concat(args.dryRun ? 'はい' : 'いいえ'));
                    console.log("  - \u6700\u5927URL\u6570: ".concat(args.maxUrls, "\u4EF6"));
                    console.log('');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 10, , 11]);
                    collectionService = new RealDataCollectionService();
                    poolService = new InformationPoolService();
                    targetUrls = [];
                    collectionMode = '';
                    // モード別のURL設定
                    switch (args.mode) {
                        case 'test':
                            console.log('🧪 テストモード: 安全なテストサイトのみ');
                            targetUrls = TEST_SCRAPING_URLS.slice(0, args.maxUrls);
                            collectionMode = 'test_sites';
                            break;
                        case 'mhlw':
                            if (!args.cancerType) {
                                console.error('❌ mhlwモードでは --cancerType が必須です');
                                process.exit(1);
                            }
                            console.log("\uD83C\uDFE5 \u539A\u52B4\u7701\u30E2\u30FC\u30C9: ".concat(args.cancerType, "\u95A2\u9023URL"));
                            targetUrls = generateMHLWUrls(args.cancerType).slice(0, args.maxUrls);
                            collectionMode = 'mhlw_official';
                            break;
                        case 'all':
                            if (!args.cancerType) {
                                console.error('❌ allモードでは --cancerType が必須です');
                                process.exit(1);
                            }
                            console.log("\uD83C\uDF10 \u5168\u53CE\u96C6\u30E2\u30FC\u30C9: ".concat(args.cancerType, "\u95A2\u9023URL + \u30C6\u30B9\u30C8\u30B5\u30A4\u30C8"));
                            mhlwUrls = generateMHLWUrls(args.cancerType);
                            manualUrls = MANUAL_ADDITIONAL_URLS.filter(function (url) {
                                return url.includes(args.cancerType) || url.includes('ganjoho.jp');
                            });
                            targetUrls = __spreadArray(__spreadArray(__spreadArray([], mhlwUrls, true), manualUrls, true), TEST_SCRAPING_URLS.slice(0, 3), true).slice(0, args.maxUrls);
                            collectionMode = 'comprehensive';
                            break;
                        default:
                            console.error("\u274C \u7121\u52B9\u306A\u30E2\u30FC\u30C9: ".concat(args.mode));
                            console.log('有効なモード: test, mhlw, all');
                            process.exit(1);
                    }
                    console.log('');
                    console.log('📋 収集対象URLリスト:');
                    console.log('='.repeat(60));
                    targetUrls.forEach(function (url, index) {
                        console.log("  [".concat(index + 1, "] ").concat(url));
                    });
                    console.log('='.repeat(60));
                    console.log("\uD83D\uDCCA \u7DCFURL\u6570: ".concat(targetUrls.length, "\u4EF6"));
                    console.log('');
                    if (args.dryRun) {
                        console.log('🔍 ドライラン: URLリスト表示のみ（実際の収集は行いません）');
                        return [2 /*return*/];
                    }
                    // 収集実行
                    console.log('🔄 データ収集開始...');
                    console.log('');
                    collectedItems = [];
                    _a = args.mode;
                    switch (_a) {
                        case 'test': return [3 /*break*/, 2];
                        case 'mhlw': return [3 /*break*/, 4];
                        case 'all': return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 6];
                case 2: return [4 /*yield*/, collectionService.collectTestSiteData({
                        cancerType: args.cancerType || 'test',
                        concernAreas: ['support_resources']
                    })];
                case 3:
                    collectedItems = _b.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, collectionService.collectAllRealData({
                        cancerType: args.cancerType,
                        concernAreas: ['treatment_options']
                    })];
                case 5:
                    collectedItems = _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    console.log('');
                    console.log('📊 収集結果サマリー:');
                    console.log("  - \u53CE\u96C6\u6210\u529F: ".concat(collectedItems.length, "\u4EF6"));
                    if (collectedItems.length > 0) {
                        console.log('  - 収集データ詳細:');
                        collectedItems.slice(0, 3).forEach(function (item, index) {
                            var _a;
                            console.log("    ".concat(index + 1, ". ").concat(item.title, " (").concat(((_a = item.rawContent) === null || _a === void 0 ? void 0 : _a.length) || 0, "\u6587\u5B57)"));
                        });
                        if (collectedItems.length > 3) {
                            console.log("    ... \u4ED6".concat(collectedItems.length - 3, "\u4EF6"));
                        }
                    }
                    if (!(collectedItems.length > 0)) return [3 /*break*/, 8];
                    console.log('');
                    console.log('💾 データベース保存開始...');
                    return [4 /*yield*/, poolService.saveCollectedItems(collectedItems)];
                case 7:
                    saveResult = _b.sent();
                    console.log('');
                    console.log('💾 保存結果サマリー:');
                    console.log("  - \u4FDD\u5B58\u6210\u529F: ".concat(saveResult.saved, "\u4EF6"));
                    console.log("  - \u91CD\u8907\u30B9\u30AD\u30C3\u30D7: ".concat(saveResult.skipped, "\u4EF6"));
                    console.log("  - \u4FDD\u5B58\u30A8\u30E9\u30FC: ".concat(saveResult.errors.length, "\u4EF6"));
                    if (saveResult.errors.length > 0) {
                        console.log('  - エラー詳細:');
                        saveResult.errors.slice(0, 3).forEach(function (error) {
                            console.log("    \u274C ".concat(error));
                        });
                        if (saveResult.errors.length > 3) {
                            console.log("    ... \u4ED6".concat(saveResult.errors.length - 3, "\u4EF6\u306E\u30A8\u30E9\u30FC"));
                        }
                    }
                    return [3 /*break*/, 9];
                case 8:
                    console.log('📝 保存対象データなし');
                    _b.label = 9;
                case 9:
                    console.log('');
                    console.log('✅ 管理者用一括収集バッチ完了');
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _b.sent();
                    console.error('❌ バッチ実行エラー:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// =============================================================================
// 実行
// =============================================================================
if (require.main === module) {
    main().catch(function (error) {
        console.error('❌ 予期しないエラー:', error);
        process.exit(1);
    });
}
