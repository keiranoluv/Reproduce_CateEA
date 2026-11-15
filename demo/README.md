# CateEA / Match Lab

Web demo tĩnh, hướng dẫn tiếng Việt, gồm **48 cặp test** tuyển chọn từ DBP15K
JA–EN/ZH–EN, **6 câu hỏi**, **4 góc nhìn** và **7 case được báo cáo trong Table 6**.
Chạy trong trình duyệt, không cần backend, checkpoint, GPU hay API key.

**Bản online:** https://keiranoluv.github.io/Reproduce_CateEA/

## Chạy

Từ gốc repository:

```bash
python -m http.server 4173 --directory demo
```

Mở http://localhost:4173. Cần HTTP để tải JSON; không mở bằng `file://`.
Đường dẫn tài nguyên là tương đối, có thể deploy nguyên `demo/` trên static
hosting, kể cả GitHub Pages project subpath.

## Case Hàm Nghi – Tự Đức

Nguồn: [paper, Appendix A.5 / Table 6, trang 5986](https://aclanthology.org/2025.coling-main.399.pdf#page=12).
Nguồn JA `8853` là `咸宜帝`, ghép chuẩn với EN `19353`, `Hàm_Nghi`.
EN `12709` là `Tự_Đức`.

Ba chế độ trong giao diện:

- **Bạn thử ghép:** chọn Hàm Nghi, Tự Đức hoặc Bảo Đại.
- **Kết quả paper:** phát lại dự đoán được báo cáo, không ICS → Tự Đức;
  có ICS → Hàm Nghi. Đây là dữ liệu Table 6, không phải inference mới. Ô Tự Đức
  trong PDF lỗi glyph; tên được chuẩn hóa theo entity dataset. Figure 6 minh
  họa Hachisuka Narihiro, không phải Hàm Nghi. Paper không công bố nhãn category,
  điểm số hoặc toàn bộ thứ hạng cho case này.
- **Bản tái lập:** đọc `pred.txt` và `pred_weighted.txt` từ các run đã lưu.
  Non-iterative wSF xếp Tự Đức #1, Bảo Đại #2, Hàm Nghi #3 ở cả hai file.
  Non-iterative woSF xếp Hàm Nghi #1 ở cả hai file. Iterative wSF có đáp án đúng
  hạng #5; iterative woSF có hạng #1. Không trình bày các kết quả này thành việc
  tái lập thành công sự thay đổi trong paper.

`test` và `weighted_test` **đều dùng CateEA đã huấn luyện với category supervision**.
Chuyển hai cách đánh giá chỉ thay category weighting lúc đánh giá; không phải
ablation bỏ category khỏi huấn luyện. Bật/tắt SF và iterative chọn các run riêng.

## Dữ liệu và tương tác

- `data/demo.json`: snapshot phục vụ giao diện. Có 24 cặp JA–EN, 24 cặp ZH–EN,
  các ứng viên, tối đa 4 nút lân cận mỗi thực thể chính, thuộc tính và nguồn hàng.
  Các nút ngữ cảnh bổ sung không được tính thành cặp tuyển chọn.
- `data/provenance.json`: SHA256 file đầu vào, epoch và quy ước xuất dữ liệu.
- Top 3 và hạng đáp án lấy nguyên từ **10.500 ứng viên test**, chiều nguồn → đích,
  **epoch cuối 999**, không xếp hạng lại trên các thẻ được hiển thị. File gốc dùng
  rank bắt đầu từ 0; snapshot/giao diện dùng hạng bắt đầu từ 1. Không có điểm số
  trong file dự đoán, nên giao diện không tạo điểm hay xác suất.
- Bảng chỉ số lấy từ `data/reproduction-metrics.csv`, snapshot của bảng tổng hợp
  `results/comparison.csv` trong checkout reproduction trước, có best/latest và trung bình
  hai chiều. Best chọn theo test H@1, tách với ví dụ dự đoán epoch cuối.
- Đồ thị là ngữ cảnh thật, **không phải attribution nhân quả**. Quan hệ giữ ID gốc
  vì bundle local không kèm bảng tên. `training_attrs` chỉ có tên trường, không
  có giá trị; giao diện không tự tạo các giá trị thuộc tính.
- Hoạt cảnh phương pháp minh họa cơ chế, không xuất embedding/category thật.
  Workspace hiện không có checkpoint để tạo các đầu ra này. Nhãn cụm ẩn không
  được gán thủ công thành các nhóm ngữ nghĩa quen thuộc.
- Câu hỏi là bài thử cho người xem; gợi ý có thể tiết lộ đáp án. Tiến độ lưu ở
  localStorage với key `cateea-match-lab-quiz-v1`; “Làm lại” xóa tiến độ bài thử.

## Ảnh và nguồn

Ba chân dung Hàm Nghi, Tự Đức, Bảo Đại lấy từ Wikimedia Commons. Metadata nguồn,
tác giả, giấy phép public domain, chỉnh sửa và SHA256 nằm trong
`assets/image-sources.json`; giao diện có phần ghi nguồn ảnh.

Đây là **ảnh tư liệu bổ sung**, chưa được xác nhận là ảnh dùng để tạo embedding
benchmark. Không dùng ảnh của demo DSoM để đại diện modality ảnh của CateEA.
Tên/URI/triples lấy từ dữ liệu reproduction; dữ liệu lớn và outputs giữ ngoài Git.

Font CJK được tự host bằng subset Noto Sans CJK JP (SIL OFL 1.1), để tên Nhật/Trung
hiển thị cả khi máy không cài font CJK. Nguồn pin revision và cách subset nằm trong
`assets/fonts/font-sources.json`; giấy phép trong `assets/fonts/OFL.txt`.

## Tạo lại và kiểm tra

Khi raw dataset và các file dự đoán `outputs/table1`, `outputs/table2` có mặt:

```bash
python scripts/export_demo_data.py
```

Exporter chỉ đọc dữ liệu và dự đoán có sẵn, không train hoặc inference.

```bash
python -m unittest discover -s tests -p 'test_demo_data.py' -v
```

Kiểm tra snapshot, hạng/cặp chuẩn, nguồn triple/dự đoán, ảnh và hash.
Các kiểm tra raw đối chiếu file gốc khi có sẵn, báo skip trong checkout không có raw.
Browser QA dùng Playwright riêng; không thêm dependency browser vào môi trường train.

## GitHub Pages

Workflow `.github/workflows/demo-pages.yml` dùng cùng cách triển khai như DSoM:
kiểm tra snapshot/assets, upload nguyên thư mục `demo/`, rồi deploy bằng GitHub Pages.
Push thay đổi demo lên `main` tự chạy deploy; pull request chỉ chạy kiểm tra.
Có thể chạy lại bằng `workflow_dispatch`. Pages của repo dùng nguồn GitHub Actions.

Snapshot chỉ số được giữ trong `demo/data/reproduction-metrics.csv` để exporter
có đầu vào tái tạo bảng ngay cả khi bảng tổng hợp không nằm trong checkout hiện tại.
Raw datasets, predictions và checkpoint vẫn giữ ngoài Git.
