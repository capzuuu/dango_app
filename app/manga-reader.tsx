import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Radii, Spacing, TextStyles } from "@/constants/theme";
import { ContinueItem, useContinueWatching } from "@/context/continue-watching-context";
import {
  getMangaFireDetails,
  MangaFireChapter,
  MangaFireDetails,
} from "@/lib/mangafire";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const BLOCKED_DOMAINS = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "popads.net",
  "popcash.net",
  "propellerads.com",
  "adcash.com",
  "exoclick.com",
  "adsterra.com",
  "trafficjunky.net",
  "juicyads.com",
  "hilltopads.net",
  "clickadu.com",
  "boringegotistical.com",
  "wingsmob.com",
];

const READER_CSS = `
(function() {
  try {
    window.open = function() { return null; };
    window.alert = function() {};
    window.confirm = function() { return false; };
    document.documentElement.style.background = '#000';
    document.body.style.background = '#000';
    var style = document.createElement('style');
    style.innerHTML = \`
      header, footer, #ctrl-menu, #progress-bar, #number-panel, #page-panel,
      .modal, .bg, .sharethis-inline-share-buttons, script + iframe,
      a[href*="/chapter"], a[href*="/chap"], [class*="prev"], [class*="next"],
      [id*="prev"], [id*="next"] {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      body.read, body.read main, .wrapper, main, .m-content {
        background: #000 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: auto !important;
      }
      body.read main .m-content {
        min-height: 100vh !important;
      }
      #page-wrapper {
        display: block !important;
        width: 100% !important;
        max-width: 980px !important;
        margin: 0 auto !important;
        padding: 84px 0 96px !important;
      }
      #page-wrapper .page {
        display: block !important;
        width: 100% !important;
        margin: 0 auto 8px !important;
        text-align: center !important;
        background: #000 !important;
      }
      #page-wrapper img {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        object-fit: contain !important;
      }
    \`;
    document.head.appendChild(style);
  } catch (e) {}
  true;
})();
`;

const READER_PROGRESS_SCRIPT = `
(function() {
  if (window.__dangoReaderProgressInstalled) return true;
  window.__dangoReaderProgressInstalled = true;

  var sendProgress = function() {
    try {
      var doc = document.documentElement;
      var body = document.body;
      var scrollTop = window.scrollY || doc.scrollTop || body.scrollTop || 0;
      var scrollHeight = Math.max(body.scrollHeight || 0, doc.scrollHeight || 0);
      var viewportHeight = window.innerHeight || doc.clientHeight || 1;
      var maxScroll = Math.max(scrollHeight - viewportHeight, 1);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'reader-progress',
        progress: Math.min(1, Math.max(0, scrollTop / maxScroll))
      }));
    } catch (e) {}
  };

  window.addEventListener('scroll', sendProgress, { passive: true });
  window.addEventListener('resize', sendProgress);
  setTimeout(sendProgress, 250);
  setTimeout(sendProgress, 1200);
  return true;
})();
true;
`;

const READER_DISABLE_MANGAFIRE_NAV_SCRIPT = `
(function() {
  try {
    if (window.__dangoReaderDisableNavInstalled) return true;
    window.__dangoReaderDisableNavInstalled = true;

    var isNavLikeHref = function(href) {
      if (!href) return false;
      var h = String(href).toLowerCase();

      // Common patterns for chapter navigation
      return (
        h.includes('chapter') ||
        h.includes('chap') ||
        h.includes('next') ||
        h.includes('prev') ||
        h.includes('previous') ||
        h.includes('previouschapter') ||
        h.includes('nextchapter')
      );
    };

    // Disable click navigation for anchors
    var anchors = document.querySelectorAll('a[href]');
    anchors.forEach(function(a) {
      var href = a.getAttribute('href');
      if (isNavLikeHref(href)) {
        a.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
      }
    });

    // Disable click navigation for buttons
    var buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(function(btn) {
      var txt = (btn.innerText || '').toLowerCase();
      var aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (txt.includes('next') || txt.includes('prev') || txt.includes('previous') || aria.includes('next') || aria.includes('prev') || aria.includes('previous')) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
      }
    });

    // Hide typical nav containers/buttons to reduce accidental taps
    var navCandidates = document.querySelectorAll(
      '[class*="next"],[class*="prev"],[class*="previous"],[id*="next"],[id*="prev"],[id*="previous"],[data-testid*="next"],[data-testid*="prev"]'
    );
    navCandidates.forEach(function(el) {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
    });

  } catch (e) {}
  true;
})();
true;
`;

const readerWidthScript = (fitToWidth: boolean) => `
(function() {
  try {
    var style = document.getElementById('dango-reader-width');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dango-reader-width';
      document.head.appendChild(style);
    }
    style.innerHTML = \`
      #page-wrapper {
        max-width: ${fitToWidth ? "100%" : "820px"} !important;
        padding-left: ${fitToWidth ? "0" : "8px"} !important;
        padding-right: ${fitToWidth ? "0" : "8px"} !important;
      }
    \`;
  } catch (e) {}
})();
true;
`;

function isBlockedUrl(url: string): boolean {
  const lower = url.toLowerCase();

  if (lower.includes("mangafire.to")) return false;
  if (lower.includes("mfcdn.nl")) return false;
  if (lower.includes("cloudflare")) return false;

  return BLOCKED_DOMAINS.some((domain) => lower.includes(domain));
}

function isMangaFireChapterNavUrl(url: string): boolean {
  const lower = url.toLowerCase();

  // Heuristics: stop navigation to chapter pages triggered by mangafire's own next/prev UI.
  // We only block when the URL looks like a chapter route and also contains typical nav cues.
  const looksLikeChapter =
    lower.includes("/chapter") ||
    lower.includes("/chap") ||
    lower.includes("chapter-") ||
    lower.includes("ch-");

  const looksLikeNav =
    lower.includes("next") ||
    lower.includes("prev") ||
    lower.includes("previous") ||
    lower.includes("nextchapter") ||
    lower.includes("prevchapter") ||
    lower.includes("previouschapter");

  // If it doesn't look like a chapter route, let it through (images/scripts/other assets).
  if (!looksLikeChapter) return false;

  // If it looks like chapter navigation, block it.
  return looksLikeNav;
}

export default function MangaReaderScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const {
    url = "",
    title = "",
    posterUrl = "",
  } = useLocalSearchParams<{
    url: string;
    title?: string;
    posterUrl?: string;
  }>();

  const [details, setDetails] = useState<MangaFireDetails | null>(null);
  const [selectedChapter, setSelectedChapter] =
    useState<MangaFireChapter | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingReader, setLoadingReader] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [chapterPickerVisible, setChapterPickerVisible] = useState(false);
  const [readerKey, setReaderKey] = useState(0);
  const [fitToWidth, setFitToWidth] = useState(true);
  const [progress, setProgress] = useState(0);
  const didAutoAdvanceRef = useRef(false);
  const selectedChapterRef = useRef<MangaFireChapter | null>(null);
  const { upsert: upsertContinue } = useContinueWatching();
  const saveDataRef = useRef({ title: title || 'Manga Reader', posterUri: posterUrl || null });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoadingDetails(true);
    setError(null);

    getMangaFireDetails(url)
      .then((nextDetails) => {
        if (cancelled) return;

        // Ensure "first chapter" is actually the earliest one.
        // MangaFire may return chapters in reverse order depending on the source.
        const sortedChapters = [...(nextDetails.chapters ?? [])].sort(
          (a, b) => {
            const an = Number(a.number);
            const bn = Number(b.number);

            // Prefer numeric ordering when possible.
            if (!Number.isNaN(an) && !Number.isNaN(bn) && an !== bn)
              return an - bn;

            // Fallback to string comparison.
            const at = String(a.number ?? a.id ?? "");
            const bt = String(b.number ?? b.id ?? "");
            if (at !== bt) return at.localeCompare(bt);

            // Final fallback: stable-ish by id
            return String(a.id).localeCompare(String(b.id));
          },
        );

        const normalizedDetails: MangaFireDetails = {
          ...nextDetails,
          chapters: sortedChapters,
        };

        setDetails(normalizedDetails);
        selectedChapterRef.current = sortedChapters[0] ?? null;
        setSelectedChapter(sortedChapters[0] ?? null);
        setLoadingDetails(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load manga");
        setLoadingDetails(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const posterUri = details?.posterUrl || posterUrl || null;
  const displayTitle = details?.title || title || "Manga Reader";

  // Keep saveDataRef in sync so the WebView message handler is never stale
  useEffect(() => {
    saveDataRef.current = { title: displayTitle, posterUri };
  }, [displayTitle, posterUri]);

  // Clear debounce timer on unmount
  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);
  const activeIndex = useMemo(() => {
    if (!details || !selectedChapter) return -1;
    return details.chapters.findIndex(
      (chapter) => chapter.id === selectedChapter.id,
    );
  }, [details, selectedChapter]);

  const chapterCount = details?.chapters.length ?? 0;

  useEffect(() => {
    // Reset auto-advance latch when chapter changes.
    didAutoAdvanceRef.current = false;
  }, [selectedChapter?.id]);
  const atFirstChapter = activeIndex <= 0;
  const atLastChapter = activeIndex >= chapterCount - 1;
  const progressPercent = Math.round(progress * 100);
  const progressLabel = `${progressPercent}%`;
  const progressWidth = `${progressPercent}%` as `${number}%`;

  const injectReaderScript = useCallback((script: string) => {
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const selectChapter = (chapter: MangaFireChapter) => {
    selectedChapterRef.current = chapter;
    setSelectedChapter(chapter);
    setLoadingReader(true);
    setProgress(0);
    setControlsVisible(true);
    setChapterPickerVisible(false);
  };

  const goChapter = (direction: -1 | 1) => {
    if (!details) return;

    const currentIndex = details.chapters.findIndex(
      (chapter) => chapter.id === selectedChapter?.id,
    );

    if (currentIndex === -1) {
      // Fallback: if we somehow lost alignment, jump to the earliest chapter.
      const fallback = details.chapters[0];
      if (fallback) selectChapter(fallback);
      return;
    }

    const next = details.chapters[currentIndex + direction];
    if (next) selectChapter(next);
  };

  const reloadReader = () => {
    setLoadingReader(true);
    setProgress(0);
    setReaderKey((key) => key + 1);
  };

  const jumpTo = (position: "top" | "bottom") => {
    injectReaderScript(`
      window.scrollTo({ top: ${position === "top" ? 0 : "document.body.scrollHeight"}, behavior: 'smooth' });
      true;
    `);
  };

  const toggleFitToWidth = () => {
    const nextFit = !fitToWidth;
    setFitToWidth(nextFit);
    injectReaderScript(readerWidthScript(nextFit));
  };

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        progress?: number;
      };
      if (
        message.type === "reader-progress" &&
        typeof message.progress === "number"
      ) {
        const p = message.progress;
        setProgress(p);
        const chapter = selectedChapterRef.current;
        if (!chapter) return;

        // Debounce: only write to storage 1s after scrolling stops
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
          try {
            const STORAGE_KEY = '@dango/continue-watching-v1';
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const items: ContinueItem[] = raw ? JSON.parse(raw) : [];
            const id = `manga-${url}`;
            const entry: ContinueItem = {
              id,
              type: 'manga',
              mangaUrl: url,
              title: saveDataRef.current.title,
              posterUrl: saveDataRef.current.posterUri,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              chapterNumber: chapter.number,
              resumeProgress: p,
              progress: p,
              updatedAt: Date.now(),
            };
            const filtered = items.filter(i => i.id !== id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...filtered]));
          } catch {}
        }, 1000);
      }
    } catch {
      // Ignore messages from source scripts that are not part of the reader controller.
    }
  };

  return (
    <View style={styles.container}>
      {controlsVisible ? (
        <SafeAreaView
          pointerEvents="box-none"
          style={styles.headerOverlay}
          edges={["top"]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={Colors.primaryText}
              />
            </TouchableOpacity>

            <View style={styles.titleRow}>
              {posterUri ? (
                <Image
                  source={{
                    uri: posterUri,
                    headers: { Referer: 'https://mangafire.to/' },
                  }}
                  style={styles.cover}
                  contentFit="cover"
                />
              ) : null}
              <View style={styles.titleBlock}>
                <Text style={styles.title} numberOfLines={1}>
                  {displayTitle}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {selectedChapter?.title ||
                    (loadingDetails
                      ? "Loading chapters..."
                      : "Choose a chapter")}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={reloadReader} style={styles.iconBtn}>
              <Ionicons name="refresh" size={20} color={Colors.primaryText} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : null}

      {loadingDetails ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.centerText}>Loading manga...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={Colors.error}
          />
          <Text style={styles.errorTitle}>Could not load reader</Text>
          <Text style={styles.centerText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.reader}>
            {selectedChapter ? (
              <WebView
                ref={webViewRef}
                key={`${selectedChapter.url}-${readerKey}`}
                source={{ uri: selectedChapter.url }}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                mixedContentMode="always"
                injectedJavaScriptBeforeContentLoaded={`${READER_CSS}\n${readerWidthScript(fitToWidth)}`}
                injectedJavaScript={`${READER_CSS}\n${readerWidthScript(fitToWidth)}\n${READER_PROGRESS_SCRIPT}`}
                onLoadStart={() => setLoadingReader(true)}
                onLoadEnd={() => {
                  setLoadingReader(false);
                  injectReaderScript(
                    `${readerWidthScript(fitToWidth)}\n${READER_PROGRESS_SCRIPT}`,
                  );
                }}
                onError={() => setLoadingReader(false)}
                onMessage={handleWebViewMessage}
                onShouldStartLoadWithRequest={(request) => {
                  const nextUrl = request.url ?? "";

                  // Always allow assets/scripts from the currently selected chapter page.
                  const currentChapterUrl = selectedChapterRef.current?.url ?? selectedChapter?.url;
                  if (currentChapterUrl && nextUrl && nextUrl === currentChapterUrl) {
                    return true;
                  }

                  // Block all chapter navigation — handled by our own controls.
                  if (
                    details?.chapters?.some((ch) => ch.url === nextUrl) ||
                    isMangaFireChapterNavUrl(nextUrl)
                  ) {
                    return false;
                  }

                  return !isBlockedUrl(nextUrl);
                }}
                userAgent={
                  Platform.OS === "android"
                    ? "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
                }
              />
            ) : (
              <View style={styles.center}>
                <Text style={styles.centerText}>No chapters found.</Text>
              </View>
            )}

            {/* Removed "Loading chapter..." overlay to proceed directly into Mangafire */}

            {controlsVisible && selectedChapter ? (
              <View pointerEvents="box-none" style={styles.readerControls}>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: progressWidth }]}
                  />
                </View>

                <View style={styles.floatingTools}>
                  <TouchableOpacity
                    style={[
                      styles.toolBtn,
                      atFirstChapter && styles.disabledBtn,
                    ]}
                    onPress={() => goChapter(-1)}
                    disabled={atFirstChapter}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="play-skip-back"
                      size={20}
                      color={Colors.primaryText}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chapterSelectBtn}
                    onPress={() => setChapterPickerVisible(true)}
                  >
                    <Text style={styles.chapterSelectText} numberOfLines={1}>
                      {selectedChapter.title ||
                        `Chapter ${selectedChapter.number}`}
                    </Text>
                    <Text style={styles.chapterSelectMeta}>
                      {activeIndex + 1} of {chapterCount} • {progressLabel}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toolBtn,
                      atLastChapter && styles.disabledBtn,
                    ]}
                    onPress={() => goChapter(1)}
                    disabled={atLastChapter}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="play-skip-forward"
                      size={20}
                      color={Colors.primaryText}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.quickTools}>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => jumpTo("top")}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={18}
                      color={Colors.primaryText}
                    />
                    <Text style={styles.quickBtnText}>Top</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => jumpTo("bottom")}
                  >
                    <Ionicons
                      name="arrow-down"
                      size={18}
                      color={Colors.primaryText}
                    />
                    <Text style={styles.quickBtnText}>End</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.quickBtn,
                      fitToWidth && styles.quickBtnActive,
                    ]}
                    onPress={toggleFitToWidth}
                  >
                    <Ionicons
                      name={fitToWidth ? "phone-portrait" : "tablet-portrait"}
                      size={18}
                      color={Colors.primaryText}
                    />
                    <Text style={styles.quickBtnText}>
                      {fitToWidth ? "Fit" : "Comfort"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => setControlsVisible(false)}
                  >
                    <Ionicons
                      name="eye-off"
                      size={18}
                      color={Colors.primaryText}
                    />
                    <Text style={styles.quickBtnText}>Hide</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {!controlsVisible && selectedChapter ? (
              <TouchableOpacity
                style={styles.revealControlsBtn}
                onPress={() => setControlsVisible(true)}
              >
                <Ionicons name="reader" size={20} color={Colors.primaryText} />
              </TouchableOpacity>
            ) : null}
          </View>

          {chapterPickerVisible ? (
            <View style={styles.pickerOverlay}>
              <Pressable
                style={styles.pickerScrim}
                onPress={() => setChapterPickerVisible(false)}
              />
              <SafeAreaView style={styles.chapterSheet} edges={["bottom"]}>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Chapters</Text>
                    <Text style={styles.sheetSubtitle}>{displayTitle}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => setChapterPickerVisible(false)}
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={Colors.primaryText}
                    />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={details?.chapters ?? []}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.sheetList}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[
                        styles.chapterRow,
                        selectedChapter?.id === item.id &&
                          styles.chapterRowActive,
                      ]}
                      onPress={() => selectChapter(item)}
                      activeOpacity={0.82}
                    >
                      <View style={styles.chapterNumberBadge}>
                        <Text style={styles.chapterNumberText}>
                          {item.number}
                        </Text>
                      </View>
                      <View style={styles.chapterRowText}>
                        <Text style={styles.chapterRowTitle} numberOfLines={1}>
                          {item.title || `Chapter ${item.number}`}
                        </Text>
                        <Text style={styles.chapterRowMeta}>
                          Chapter {index + 1} of {chapterCount}
                        </Text>
                      </View>
                      {selectedChapter?.id === item.id ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={Colors.primary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  )}
                />
              </SafeAreaView>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    borderColor: Colors.surfaceVariant,
    borderRadius: Radii.md,
    marginHorizontal: Spacing.md,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cover: {
    width: 34,
    height: 46,
    borderRadius: Radii.xs,
    backgroundColor: Colors.surfaceVariant,
  },
  titleBlock: { flex: 1 },
  title: { ...TextStyles.titleSmall, color: Colors.primaryText },
  subtitle: {
    ...TextStyles.labelSmall,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  disabledBtn: { opacity: 0.35 },
  reader: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1, backgroundColor: "#000" },
  readerLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  centerText: {
    ...TextStyles.bodySmall,
    color: Colors.secondaryText,
    textAlign: "center",
  },
  errorTitle: {
    ...TextStyles.titleMedium,
    color: Colors.primaryText,
    textAlign: "center",
  },
  readerControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  progressTrack: {
    height: 3,
    borderRadius: Radii.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
  },
  floatingTools: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  toolBtn: {
    width: 46,
    height: 46,
    borderRadius: Radii.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(18,18,18,0.94)",
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  chapterSelectBtn: {
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    borderRadius: Radii.md,
    backgroundColor: "rgba(18,18,18,0.94)",
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.md,
  },
  chapterSelectText: { ...TextStyles.labelLarge, color: Colors.primaryText },
  chapterSelectMeta: {
    ...TextStyles.labelSmall,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  quickTools: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  quickBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(18,18,18,0.94)",
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  quickBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(229,9,20,0.22)",
  },
  quickBtnText: { ...TextStyles.labelMedium, color: Colors.primaryText },
  revealControlsBtn: {
    position: "absolute",
    right: Spacing.md,
    bottom: Spacing.md,
    width: 46,
    height: 46,
    borderRadius: Radii.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(18,18,18,0.94)",
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  pickerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  chapterSheet: {
    maxHeight: "70%",
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sheetTitle: { ...TextStyles.titleMedium, color: Colors.primaryText },
  sheetSubtitle: {
    ...TextStyles.bodySmall,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  sheetList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  chapterRow: {
    minHeight: 58,
    borderRadius: Radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  chapterRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  chapterNumberBadge: {
    minWidth: 42,
    height: 34,
    borderRadius: Radii.sm,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.secondaryBackground,
    paddingHorizontal: Spacing.xs,
  },
  chapterNumberText: { ...TextStyles.labelMedium, color: Colors.primaryText },
  chapterRowText: { flex: 1 },
  chapterRowTitle: { ...TextStyles.labelLarge, color: Colors.primaryText },
  chapterRowMeta: {
    ...TextStyles.labelSmall,
    color: Colors.secondaryText,
    marginTop: 2,
  },
});
