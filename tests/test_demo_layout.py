"""Optional browser checks for graph labels, responsive views, and the reader."""

import functools
import http.server
import threading
import unittest
from pathlib import Path

try:
    from playwright.sync_api import Error, expect, sync_playwright
except ImportError:
    sync_playwright = None

DEMO = Path(__file__).resolve().parents[1] / "demo"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@unittest.skipIf(sync_playwright is None, "Playwright is not installed")
class GraphLayoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = functools.partial(QuietHandler, directory=str(DEMO))
        cls.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.addClassCleanup(cls.server.server_close)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.addClassCleanup(cls.server.shutdown)
        cls.url = f"http://127.0.0.1:{cls.server.server_address[1]}"
        cls.playwright = sync_playwright().start()
        cls.addClassCleanup(cls.playwright.stop)
        try:
            cls.browser = cls.playwright.chromium.launch(headless=True)
        except Error as error:
            raise unittest.SkipTest(f"Chromium is unavailable: {error}") from error
        cls.addClassCleanup(cls.browser.close)

    def setUp(self):
        self.context = self.browser.new_context(
            viewport={"width": 1440, "height": 1000}, reduced_motion="reduce"
        )
        self.addCleanup(self.context.close)
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.goto(self.url, wait_until="networkidle")
        expect(self.page.locator("#app")).to_be_visible()
        self.page.evaluate("document.fonts.ready")
        self.page.evaluate("layoutGraphSurfaces(true)")

    def tearDown(self):
        self.assertEqual(self.errors, [])

    def test_labels_fit_nodes_and_viewport_for_all_context_entities(self):
        result = self.page.evaluate("""() => {
          const fixture = document.createElement('div');
          fixture.style.cssText = 'position:absolute;left:-10000px;top:0';
          document.body.append(fixture);
          const errors = [];
          let checked = 0;
          for (const root of Object.values(data.entities).filter(e => e.neighbors.length)) {
            for (const [width, expanded] of [[220,false],[420,false],[860,true]]) {
              fixture.style.width = width + 'px';
              fixture.className = root.side === 2 ? 'target' : '';
              fixture.innerHTML = miniGraph(root.id, 'geometry-check', expanded);
              drawGraph(fixture.firstElementChild, true);
              const svg = fixture.querySelector('svg'), view = svg.viewBox.baseVal;
              for (const text of svg.querySelectorAll('text')) {
                const box = text.getBBox();
                if (box.x < -1 || box.y < -1 || box.x + box.width > view.width + 1 || box.y + box.height > view.height + 1)
                  errors.push({root:root.id,width,label:text.textContent,issue:'outside SVG'});
                const node = text.closest('.graph-node');
                if (node) {
                  const card = node.querySelector('rect').getBBox();
                  if (box.x < card.x + 6 || box.y < card.y + 6 || box.x + box.width > card.x + card.width - 6 || box.y + box.height > card.y + card.height - 6)
                    errors.push({root:root.id,width,label:text.textContent,issue:'outside node padding'});
                }
              }
              checked++;
            }
          }
          fixture.remove();
          return {checked, count:errors.length, examples:errors.slice(0,8)};
        }""")
        self.assertGreater(result["checked"], 900)
        self.assertEqual(result["count"], 0, result)

    def test_responsive_comparison_and_graph_switch(self):
        page = self.page
        for width in (320, 390, 768, 1024, 1280, 1440):
            with self.subTest(width=width):
                page.set_viewport_size({"width": width, "height": 900})
                page.evaluate("jumpToPair('ja_en:22174')")
                expect(page.locator(".entity-graph-panel.source")).to_be_visible()
                if width < 1200:
                    expect(page.locator(".entity-graph-panel.target")).to_be_hidden()
                    page.locator('[data-graph-view="target"]').click()
                    expect(page.locator(".entity-graph-panel.target")).to_be_visible()
                    expect(page.locator(".entity-graph-panel.source")).to_be_hidden()
                    expect(page.locator('[data-graph-view="target"]')).to_have_attribute("aria-pressed", "true")
                else:
                    expect(page.locator(".entity-graph-panel.target")).to_be_visible()
                    expect(page.locator(".graph-view-tabs")).to_be_hidden()
                self.assertFalse(page.evaluate("document.documentElement.scrollWidth > innerWidth"))

    def test_candidate_opens_target_and_reader_preserves_context(self):
        page = self.page
        page.set_viewport_size({"width": 390, "height": 844})
        page.locator('[data-candidate="ja_en:19353"]').click()
        expect(page.locator('[data-graph-view="target"]')).to_have_attribute("aria-pressed", "true")
        expect(page.locator(".entity-graph-panel.target")).to_be_visible()
        opener = page.locator('.entity-graph-panel.target [data-expand-graph]')
        opener.click()
        expect(page.locator("#graph-dialog")).to_be_visible()
        expect(page.locator("#graph-dialog-title")).to_have_text("Hàm Nghi")
        self.assertFalse(page.locator("#graph-dialog").evaluate("el => el.scrollWidth > el.clientWidth"))
        page.locator("#graph-dialog .graph-neighbor-list button").first.click()
        expect(page.locator("#evidence-dialog")).to_be_visible()
        page.keyboard.press("Escape")
        expect(page.locator("#graph-dialog")).to_be_visible()
        page.locator("#graph-dialog-close").click()
        expect(page.locator("#graph-dialog")).to_be_hidden()
        expect(opener).to_be_focused()
        edge = page.locator(".entity-graph-panel.target .graph-edge").first
        edge.focus()
        page.keyboard.press("Enter")
        expect(page.locator("#dialog-title")).to_have_text("Quan hệ trong dữ liệu gốc")
        page.keyboard.press("Escape")
        expect(page.locator('[data-candidate="ja_en:19353"]')).to_have_attribute("aria-pressed", "true")


if __name__ == "__main__":
    unittest.main()
