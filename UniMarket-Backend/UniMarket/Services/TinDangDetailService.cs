using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using UniMarket.Models.Mongo;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace UniMarket.Services
{
    // 1. Class cấu hình (Model hứng dữ liệu từ appsettings.json)
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string CollectionName { get; set; } = null!;
    }

    // 2. Service chính xử lý MongoDB
    public class TinDangDetailService
    {
        private readonly IMongoCollection<TinDangDetail> _detailsCollection;

        public TinDangDetailService(IConfiguration config)
        {
            // Lấy config từ appsettings.json
            var mongoSettings = config.GetSection("MongoDbSettings").Get<MongoDbSettings>();
            var connectionString = config.GetConnectionString("MongoDbConnection");

            // Khởi tạo Client và Database
            var mongoClient = new MongoClient(connectionString);
            var mongoDatabase = mongoClient.GetDatabase(mongoSettings.DatabaseName);

            // Lấy Collection (Bảng)
            _detailsCollection = mongoDatabase.GetCollection<TinDangDetail>(mongoSettings.CollectionName);
        }

        // =========================================================
        // CÁC HÀM TRUY VẤN CƠ BẢN
        // =========================================================

        /// <summary>
        /// Lấy chi tiết tin đăng dựa theo Mã Tin Đăng (SQL ID)
        /// </summary>
        public async Task<TinDangDetail?> GetByMaTinDangAsync(int maTinDang) =>
            await _detailsCollection.Find(x => x.MaTinDang == maTinDang).FirstOrDefaultAsync();

        /// <summary>
        /// Tạo mới một chi tiết tin đăng
        /// </summary>
        public async Task CreateAsync(TinDangDetail newDetail) =>
            await _detailsCollection.InsertOneAsync(newDetail);

        /// <summary>
        /// Cập nhật nội dung chi tiết (Dùng cho Update thông thường)
        /// </summary>
        public async Task UpdateAsync(int maTinDang, BsonDocument updatedChiTiet)
        {
            var filter = Builders<TinDangDetail>.Filter.Eq(x => x.MaTinDang, maTinDang);
            var update = Builders<TinDangDetail>.Update.Set(x => x.ChiTiet, updatedChiTiet);
            await _detailsCollection.UpdateOneAsync(filter, update);
        }

        // =========================================================
        // CÁC HÀM XÓA (DELETE)
        // =========================================================

        /// <summary>
        /// Xóa chi tiết dựa theo Mã Tin Đăng (Dùng khi xóa tin bên SQL)
        /// </summary>
        public async Task RemoveAsync(int maTinDang) =>
            await _detailsCollection.DeleteOneAsync(x => x.MaTinDang == maTinDang);

        /// <summary>
        /// ✅ [QUAN TRỌNG] Xóa chi tiết dựa theo ID MongoDB (Chuỗi string _id)
        /// Hàm này dùng để xóa document cũ bị lỗi trước khi tạo mới trong hàm Update PutTinDang
        /// </summary>
        /// <param name="id">ID của document trong MongoDB (ObjectId dạng string)</param>
        public async Task DeleteByIdAsync(string id)
        {
            await _detailsCollection.DeleteOneAsync(x => x.Id == id);
        }
        public async Task<List<int>> GetIdsByFilterAsync(Dictionary<string, string> filters)
        {
            if (filters == null || filters.Count == 0) return new List<int>();

            var builder = Builders<TinDangDetail>.Filter;
            var filterDefinition = builder.Empty;

            foreach (var item in filters)
            {
                if (string.IsNullOrEmpty(item.Key) || string.IsNullOrEmpty(item.Value)) continue;

                // 1. DIỆN TÍCH TỐI THIỂU (Range Filter dùng JS trên MongoDB)
                if (item.Key.Equals("dienTichMin", StringComparison.OrdinalIgnoreCase) || item.Key.Equals("DienTichMin", StringComparison.OrdinalIgnoreCase))
                {
                    if (double.TryParse(item.Value, out double min))
                    {
                        var js = $"parseFloat(this.dienTich || this.DienTich || 0) >= {min}";
                        filterDefinition &= new BsonDocument("$where", js);
                    }
                    continue;
                }

                // 2. DIỆN TÍCH TỐI ĐA (Range Filter dùng JS trên MongoDB)
                if (item.Key.Equals("dienTichMax", StringComparison.OrdinalIgnoreCase) || item.Key.Equals("DienTichMax", StringComparison.OrdinalIgnoreCase))
                {
                    if (double.TryParse(item.Value, out double max))
                    {
                        var js = $"var v = parseFloat(this.dienTich || this.DienTich); !isNaN(v) && v <= {max}";
                        filterDefinition &= new BsonDocument("$where", js);
                    }
                    continue;
                }

                // 3. TIỆN ÍCH (Lọc phần tử mảng phân cách bằng dấu phẩy - tất cả tiện ích đều phải có -> AND)
                if (item.Key.Equals("tienIch", StringComparison.OrdinalIgnoreCase) || item.Key.Equals("TienIch", StringComparison.OrdinalIgnoreCase))
                {
                    var amens = item.Value.Split(',').Select(x => x.Trim()).ToList();
                    foreach (var a in amens)
                    {
                        var regexFilter = new BsonRegularExpression($".*{Regex.Escape(a)}.*", "i");
                        var condition = builder.Regex("tienIch", regexFilter) | builder.Regex("TienIch", regexFilter);
                        filterDefinition &= condition; 
                    }
                    continue;
                }

                // 4. LOẠI PHÒNG (Nhiều loại phòng - 1 trong số đó là được -> OR)
                if (item.Key.Equals("loaiPhong", StringComparison.OrdinalIgnoreCase) || item.Key.Equals("LoaiPhong", StringComparison.OrdinalIgnoreCase))
                {
                    var types = item.Value.Split(',').Select(x => x.Trim()).ToList();
                    var orCondition = builder.Empty;
                    bool hasOr = false;
                    foreach (var t in types)
                    {
                        var regexFilter = new BsonRegularExpression($".*{Regex.Escape(t)}.*", "i");
                        var condition = builder.Regex("loaiPhong", regexFilter) | builder.Regex("LoaiPhong", regexFilter);
                        if (!hasOr) { orCondition = condition; hasOr = true; }
                        else { orCondition |= condition; }
                    }
                    if (hasOr) filterDefinition &= orCondition;
                    continue;
                }

                // 5. CÁC TRƯỜNG CÒN LẠI (Filter Exact Match thông thường)
                var valuePattern = $"^{Regex.Escape(item.Value)}$";
                var standardRegex = new BsonRegularExpression(valuePattern, "i");

                string keyInput = item.Key;
                string keyCamel = char.ToLower(keyInput[0]) + (keyInput.Length > 1 ? keyInput.Substring(1) : "");
                string keyPascal = char.ToUpper(keyInput[0]) + (keyInput.Length > 1 ? keyInput.Substring(1) : "");

                var standardCondition = builder.Regex(keyCamel, standardRegex) |
                                        builder.Regex(keyPascal, standardRegex);

                filterDefinition &= standardCondition;
            }

            try
            {
                // 5. Query
                var results = await _detailsCollection
                    .Find(filterDefinition)
                    .Project(x => x.MaTinDang)
                    .ToListAsync();

                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Lỗi Query Mongo: " + ex.Message);
                return new List<int>();
            }
        }
    }
}