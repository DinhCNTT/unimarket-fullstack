using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;
using Elastic.Transport;
using UniMarket.DTO;
using UniMarket.Models.Elastic;

namespace UniMarket.Services.ElasticSearch
{
    public class ElasticSearchService
    {
        private readonly ElasticsearchClient _client;
        private readonly string _indexName;
        private readonly ILogger<ElasticSearchService> _logger;

        public ElasticSearchService(IConfiguration configuration, ILogger<ElasticSearchService> logger)
        {
            _logger = logger;
            var esSettings = configuration.GetSection("ElasticsearchSettings");
            var uri = esSettings["Uri"] ?? "https://localhost:9200";
            _indexName = esSettings["DefaultIndex"] ?? "unimarket_tindang";
            var username = esSettings["Username"] ?? "elastic";
            var password = esSettings["Password"] ?? "";
            var bypassSsl = bool.Parse(esSettings["BypassSsl"] ?? "true");

            var settings = new ElasticsearchClientSettings(new Uri(uri))
                .DefaultIndex(_indexName)
                .Authentication(new BasicAuthentication(username, password));

            if (bypassSsl)
            {
                // Bỏ qua xác thực chứng chỉ SSL tự ký khi chạy local
                settings.ServerCertificateValidationCallback((sender, certificate, chain, sslPolicyErrors) => true);
            }

            _client = new ElasticsearchClient(settings);
        }

        /// <summary>
        /// Khởi tạo Index nếu chưa tồn tại
        /// </summary>
        public async Task InitializeIndexAsync()
        {
            try
            {
                var existsResponse = await _client.Indices.ExistsAsync(_indexName);
                if (!existsResponse.Exists)
                {
                    _logger.LogInformation("Index {IndexName} chưa tồn tại. Tiến hành khởi tạo...", _indexName);
                    await CreateIndexInternalAsync();
                }
                else
                {
                    _logger.LogInformation("Index {IndexName} đã tồn tại.", _indexName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong quá trình khởi tạo Elasticsearch Index.");
            }
        }

        /// <summary>
        /// Tạo lại Index mới (Xóa cũ nếu có)
        /// </summary>
        public async Task RecreateIndexAsync()
        {
            try
            {
                _logger.LogInformation("Đang tạo lại Elasticsearch index: {IndexName}", _indexName);
                var existsResponse = await _client.Indices.ExistsAsync(_indexName);
                if (existsResponse.Exists)
                {
                    _logger.LogInformation("Đang xóa index {IndexName} cũ...", _indexName);
                    await _client.Indices.DeleteAsync(_indexName);
                }
                await CreateIndexInternalAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra khi tạo lại Elasticsearch Index.");
            }
        }

        private async Task CreateIndexInternalAsync()
        {
            var createResponse = await _client.Indices.CreateAsync(_indexName, c => c
                .Settings(s => s
                    .Analysis(analysis => analysis
                        .Analyzers(analyzers => analyzers
                            .Custom("vietnamese_analyzer", custom => custom
                                .Tokenizer("standard")
                                .Filter(new[] { "lowercase", "asciifolding" })
                            )
                        )
                    )
                )
                .Mappings(mappings => mappings
                    .Properties<TinDangIndexModel>(properties => properties
                        .Text(t => t.TieuDe, text => text.Analyzer("vietnamese_analyzer"))
                        .Text(t => t.MoTa, text => text.Analyzer("vietnamese_analyzer"))
                        .Text(t => t.DiaChi, text => text.Analyzer("vietnamese_analyzer"))
                        .IntegerNumber(i => i.MaTinDang)
                        .IntegerNumber(i => i.MaDanhMuc)
                        .Keyword(k => k.TenDanhMuc)
                        .Keyword(k => k.TenDanhMucCha)
                        .DoubleNumber(d => d.Gia)
                        .Boolean(b => b.CoTheThoaThuan)
                        .IntegerNumber(i => i.MaTinhThanh)
                        .Keyword(k => k.TenTinhThanh)
                        .IntegerNumber(i => i.MaQuanHuyen)
                        .Keyword(k => k.TenQuanHuyen)
                        .Date(d => d.NgayDang)
                        .IntegerNumber(i => i.TrangThai)
                        .Boolean(b => b.IsDeleted)
                        .Keyword(k => k.MaNguoiBan)
                        .Keyword(k => k.TenNguoiBan)
                        .Keyword(k => k.TinhTrang)
                        .Keyword(k => k.VideoUrl)
                    )
                )
            );

            if (createResponse.IsValidResponse)
            {
                _logger.LogInformation("Khởi tạo Index {IndexName} thành công với Vietnamese Analyzer.", _indexName);
            }
            else
            {
                _logger.LogError("Lỗi khởi tạo Index: {Error}", createResponse.DebugInformation);
            }
        }

        /// <summary>
        /// Đẩy 1 tin đăng lên Elasticsearch
        /// </summary>
        public async Task IndexPostAsync(TinDangIndexModel post)
        {
            try
            {
                var response = await _client.IndexAsync(post, idx => idx.Index(_indexName).Id(post.MaTinDang.ToString()));
                if (!response.IsValidResponse)
                {
                    _logger.LogError("Lỗi khi index bài viết {Id} lên ES: {Error}", post.MaTinDang, response.DebugInformation);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đồng bộ tin đăng {Id} lên Elasticsearch.", post.MaTinDang);
            }
        }

        /// <summary>
        /// Đẩy số lượng lớn tin đăng lên Elasticsearch (Bulk)
        /// </summary>
        public async Task BulkIndexPostsAsync(List<TinDangIndexModel> posts)
        {
            try
            {
                if (posts == null || !posts.Any()) return;

                var response = await _client.IndexManyAsync(posts, _indexName);
                if (!response.IsValidResponse)
                {
                    _logger.LogError("Lỗi khi Bulk Index lên ES: {Error}", response.DebugInformation);
                }
                else
                {
                    _logger.LogInformation("Đã bulk index thành công {Count} bài đăng lên Elasticsearch.", posts.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi bulk index dữ liệu lên Elasticsearch.");
            }
        }

        /// <summary>
        /// Xóa tin đăng khỏi Elasticsearch
        /// </summary>
        public async Task DeletePostAsync(int maTinDang)
        {
            try
            {
                var response = await _client.DeleteAsync<TinDangIndexModel>(maTinDang.ToString(), idx => idx.Index(_indexName));
                if (!response.IsValidResponse)
                {
                    _logger.LogError("Lỗi khi xóa bài viết {Id} khỏi ES: {Error}", maTinDang, response.DebugInformation);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa bài đăng {Id} khỏi Elasticsearch.", maTinDang);
            }
        }

        /// <summary>
        /// Lọc & Tìm kiếm tin đăng sử dụng Elasticsearch
        /// </summary>
        public async Task<(List<TinDangIndexModel> Data, long TotalItems)> SearchPostsAsync(PostFilterRequest request)
        {
            try
            {
                var mustQueries = new List<Query>();
                var filterQueries = new List<Query>();

                // Chỉ tìm kiếm các tin đăng Đã duyệt (TrangThai = 1) và Chưa xóa (IsDeleted = false)
                filterQueries.Add(new TermQuery(Infer.Field<TinDangIndexModel>(f => f.IsDeleted)) { Value = false });
                filterQueries.Add(new TermQuery(Infer.Field<TinDangIndexModel>(f => f.TrangThai)) { Value = 1 });

                // 1. Tìm kiếm toàn văn (Full-text Search) với Vietnamese Analyzer
                if (!string.IsNullOrEmpty(request.SearchTerm))
                {
                    var keyword = request.SearchTerm.Trim();
                    mustQueries.Add(new MultiMatchQuery
                    {
                        Query = keyword,
                        Fields = new[] { "tieuDe^4", "tenDanhMuc^3", "tenDanhMucCha^2", "moTa", "diaChi" },
                        Operator = Operator.And,
                        Fuzziness = new Fuzziness("AUTO")
                    });
                }

                // 2. Bộ lọc Category ID
                if (request.CategoryId.HasValue && request.CategoryId.Value > 0)
                {
                    filterQueries.Add(new TermQuery(Infer.Field<TinDangIndexModel>(f => f.MaDanhMuc)) { Value = request.CategoryId.Value });
                }

                // 3. Bộ lọc CategoryGroup (Danh mục cha)
                if (!string.IsNullOrEmpty(request.CategoryGroup))
                {
                    filterQueries.Add(new TermQuery(Infer.Field<TinDangIndexModel>(f => f.TenDanhMucCha)) { Value = request.CategoryGroup.Trim() });
                }

                // 4. Bộ lọc SubCategory (Danh mục con - hỗ trợ nhiều danh mục phân cách bằng dấu phẩy)
                if (!string.IsNullOrEmpty(request.SubCategory))
                {
                    var subCategories = request.SubCategory.Split(',')
                        .Select(s => s.Trim())
                        .Where(s => !string.IsNullOrEmpty(s))
                        .ToList();

                    if (subCategories.Any())
                    {
                        var subCategoryQueries = subCategories
                            .Select(sub => (Query)new TermQuery(Infer.Field<TinDangIndexModel>(f => f.TenDanhMuc)) { Value = sub })
                            .ToList();
                        
                        // Ghép các danh mục bằng toán tử OR (Bool -> Should)
                        filterQueries.Add(new BoolQuery { Should = subCategoryQueries.ToArray() });
                    }
                }

                // 5. Bộ lọc Giá bán (MinPrice / MaxPrice)
                if (request.MinPrice.HasValue || request.MaxPrice.HasValue)
                {
                    var priceRange = new NumberRangeQuery(Infer.Field<TinDangIndexModel>(f => f.Gia));
                    if (request.MinPrice.HasValue) priceRange.Gte = (double)request.MinPrice.Value;
                    if (request.MaxPrice.HasValue) priceRange.Lte = (double)request.MaxPrice.Value;
                    filterQueries.Add(priceRange);
                }

                // 6. Bộ lọc Vị trí địa lý (Tỉnh thành / Quận huyện)
                if (request.ProvinceId.HasValue)
                {
                    filterQueries.Add(new TermQuery(Infer.Field<TinDangIndexModel>(f => f.MaTinhThanh)) { Value = request.ProvinceId.Value });
                }
                if (request.DistrictId.HasValue)
                {
                    filterQueries.Add(new TermQuery(Infer.Field<TinDangIndexModel>(f => f.MaQuanHuyen)) { Value = request.DistrictId.Value });
                }

                // 7. Lọc các bài viết có Video
                if (request.HasVideo == true)
                {
                    filterQueries.Add(new ExistsQuery { Field = Infer.Field<TinDangIndexModel>(f => f.VideoUrl) });
                }

                // 8. Bộ lọc động thuộc tính chi tiết MongoDB (AdvancedFilters)
                if (!string.IsNullOrEmpty(request.AdvancedFilters))
                {
                    try
                    {
                        var mongoFilters = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(request.AdvancedFilters);
                        if (mongoFilters != null && mongoFilters.Any())
                        {
                            foreach (var filter in mongoFilters)
                            {
                                if (!string.IsNullOrEmpty(filter.Value))
                                {
                                    // Tìm theo format: chiTietObj.tenThuocTinh
                                    // Dùng MatchQuery cho nested object
                                    var fieldPath = $"chiTietObj.{filter.Key}";
                                    filterQueries.Add(new MatchQuery(fieldPath) { Query = filter.Value });
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Lỗi giải mã AdvancedFilters JSON trong ES Search.");
                    }
                }

                // Thực thi Search
                var searchResponse = await _client.SearchAsync<TinDangIndexModel>(s => s
                    .Index(_indexName)
                    .From((request.Page - 1) * request.Limit)
                    .Size(request.Limit)
                    .Query(q => q
                        .Bool(b => b
                            .Must(mustQueries.ToArray())
                            .Filter(filterQueries.ToArray())
                        )
                    )
                    .Sort(srt => {
                        // Sắp xếp
                        switch (request.SortOrder?.ToLower())
                        {
                            case "oldest":
                                srt.Field(f => f.NgayDang, f => f.Order(SortOrder.Asc));
                                break;
                            case "price_asc":
                                srt.Field(f => f.Gia, f => f.Order(SortOrder.Asc));
                                break;
                            case "price_desc":
                                srt.Field(f => f.Gia, f => f.Order(SortOrder.Desc));
                                break;
                            case "newest":
                                srt.Field(f => f.NgayDang, f => f.Order(SortOrder.Desc));
                                break;
                            case "relevance":
                            default:
                                if (!string.IsNullOrEmpty(request.SearchTerm))
                                {
                                    // Khi có từ khóa tìm kiếm: Ưu tiên điểm khớp liên quan (_score) lên đầu
                                    srt.Score(sc => sc.Order(SortOrder.Desc));
                                }
                                else
                                {
                                    // Mặc định không tìm từ khóa: Tin mới nhất xếp trên
                                    srt.Field(f => f.NgayDang, f => f.Order(SortOrder.Desc));
                                }
                                break;
                        }
                    })
                );

                if (!searchResponse.IsValidResponse)
                {
                    _logger.LogError("Lỗi khi tìm kiếm trên Elasticsearch: {Error}", searchResponse.DebugInformation);
                    return (new List<TinDangIndexModel>(), 0);
                }

                var data = searchResponse.Documents.ToList();
                var total = searchResponse.Total;

                return (data, total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra khi tìm kiếm tin đăng trên Elasticsearch.");
                return (new List<TinDangIndexModel>(), 0);
            }
        }
    }
}
