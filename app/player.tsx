import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { useContinueWatching } from '@/context/continue-watching-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// ─── Videasy URL builder ──────────────────────────────────────────────────────

function buildVideasyUrl(params: {
  id: string;
  type: 'movie' | 'tv';
  season?: string;
  episode?: string;
}): string {
  const base = 'https://player.videasy.net';
  const color = 'E50914';
  if (params.type === 'tv') {
    const s = params.season ?? '1';
    const e = params.episode ?? '1';
    return (
      `${base}/tv/${params.id}/${s}/${e}` +
      `?color=${color}&episodeSelector=true&nextEpisode=true&autoplayNextEpisode=true`
    );
  }
  return `${base}/movie/${params.id}?color=${color}`;
}

// ─── Ad blocker — Layer 1: native domain blocklist ───────────────────────────
// Only blocks known ad networks. Videasy and all its subdomains are allowed.

const BLOCKED_DOMAINS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'adservice.google.com', 'adnxs.com', 'adsrvr.org', 'rubiconproject.com',
  'openx.net', 'pubmatic.com', 'casalemedia.com', 'smartadserver.com',
  'taboola.com', 'outbrain.com', 'revcontent.com', 'mgid.com',
  'popads.net', 'popcash.net', 'propellerads.com', 'adcash.com',
  'trafficjunky.net', 'exoclick.com', 'juicyads.com', 'hilltopads.net',
  'clickadu.com', 'adsterra.com', 'yllix.com', 'plugrush.com',
  'go.oclasrv.com', 'adskeeper.co.uk', 'bidvertiser.com',
  'adf.ly', 'shorte.st', 'ouo.io', 'bc.vc', 'linkbucks.com',
];

function isBlockedUrl(url: string): boolean {
  try {
    const lower = url.toLowerCase();
    // Always allow videasy and its CDN/API subdomains
    if (lower.includes('videasy.net')) return false;
    if (lower.includes('image.tmdb.org')) return false;
    return BLOCKED_DOMAINS.some(d => lower.includes(d));
  } catch {
    return false;
  }
}

// ─── Ad blocker — Layer 2: JS before page scripts ────────────────────────────
// Kills popups and blocks ad script injection.
// Does NOT touch window.location — that breaks Videasy's episode selector.

const AD_BLOCKER_BEFORE = `
(function() {
  function toStr(v) {
    try { return (v == null) ? '' : String(v); } catch(e) { return ''; }
  }
  function contains(str, sub) {
    try { return toStr(str).indexOf(sub) !== -1; } catch(e) { return false; }
  }

  // Kill popup ads
  window.open = function() { return null; };
  window.alert = function() {};
  window.confirm = function() { return false; };
  window.prompt = function() { return null; };

  // Block ad scripts/iframes from being injected dynamically
  var _createElement = document.createElement.bind(document);
  var AD_HOSTS = [
    'popads','popcash','propellerads','adcash','exoclick',
    'adsterra','trafficjunky','juicyads','hilltopads','clickadu',
    'doubleclick','googlesyndication','adnxs','taboola','outbrain',
  ];

  document.createElement = function(tag) {
    var el = _createElement(tag);
    var tagLow = toStr(tag).toLowerCase();
    if (tagLow === 'script' || tagLow === 'iframe') {
      var proto = tagLow === 'script'
        ? HTMLScriptElement.prototype
        : HTMLIFrameElement.prototype;
      var _srcDesc = Object.getOwnPropertyDescriptor(proto, 'src');
      try {
        Object.defineProperty(el, 'src', {
          set: function(val) {
            var s = toStr(val);
            if (AD_HOSTS.some(function(h) { return contains(s, h); })) return;
            if (_srcDesc && _srcDesc.set) _srcDesc.set.call(this, val);
          },
          get: function() {
            if (_srcDesc && _srcDesc.get) return _srcDesc.get.call(this);
            return '';
          },
          configurable: true,
        });
      } catch(e) {}
    }
    return el;
  };

  true;
})();
`;

// ─── Ad blocker — Layer 3: JS after page loads ───────────────────────────────
// Removes ad DOM nodes and kills ad countdown timers.

const AD_BLOCKER_AFTER = `
(function() {
  function toStr(v) {
    try { return (v == null) ? '' : String(v); } catch(e) { return ''; }
  }
  function contains(str, sub) {
    try { return toStr(str).indexOf(sub) !== -1; } catch(e) { return false; }
  }

  var AD_HOSTS = [
    'popads','popcash','propellerads','adcash','exoclick',
    'adsterra','trafficjunky','juicyads','hilltopads','clickadu',
    'doubleclick','googlesyndication','adnxs','taboola','outbrain',
  ];

  var adSelectors = [
    'iframe[src*="popads"]','iframe[src*="popcash"]',
    'iframe[src*="exoclick"]','iframe[src*="adsterra"]',
    'iframe[src*="propellerads"]','iframe[src*="trafficjunky"]',
    'div[id*="ad-"]','div[class*="ad-"]',
    'div[id*="popup"]','div[class*="popup"]',
    'ins.adsbygoogle','#aswift_0','#google_ads_frame',
  ];

  function removeAds() {
    adSelectors.forEach(function(sel) {
      try {
        document.querySelectorAll(sel).forEach(function(el) {
          if (el.parentNode) el.parentNode.removeChild(el);
        });
      } catch(e) {}
    });
  }

  removeAds();

  try {
    if (window.MutationObserver) {
      new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          m.addedNodes.forEach(function(node) {
            try {
              if (node.nodeType !== 1) return;
              var src = toStr(node.src || node.href || '');
              if (AD_HOSTS.some(function(h) { return contains(src, h); })) {
                if (node.parentNode) node.parentNode.removeChild(node);
              }
            } catch(e) {}
          });
        });
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  } catch(e) {}

  true;
})();
`;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const { upsert } = useContinueWatching();

  const {
    id,
    type = 'movie',
    season = '1',
    episode = '1',
    title = '',
    posterPath = '',
    backdropPath = '',
  } = useLocalSearchParams<{
    id: string;
    type: 'movie' | 'tv';
    season: string;
    episode: string;
    title: string;
    posterPath: string;
    backdropPath: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(Number(season ?? 1));
  const [currentEp, setCurrentEp] = useState(Number(episode ?? 1));
  const [controlsVisible, setControlsVisible] = useState(true);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  const autoNextTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasLoadedOnce = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const visibleRef = useRef(true);

  const cancelAutoNext = () => {
    if (autoNextTimer.current) { clearInterval(autoNextTimer.current); autoNextTimer.current = null; }
    setAutoNextCountdown(null);
  };

  const startAutoNext = () => {
    cancelAutoNext();
    let count = 30;
    setAutoNextCountdown(count);
    autoNextTimer.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        cancelAutoNext();
        setCurrentEp(prev => prev + 1);
      } else {
        setAutoNextCountdown(count);
      }
    }, 1000);
  };

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      setControlsVisible(false);
      visibleRef.current = false;
    }, 3000);
  };

  const showControls = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    setControlsVisible(true);
    visibleRef.current = true;
    scheduleHide();
  };

  const toggleControls = () => {
    if (visibleRef.current) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      Animated.timing(controlsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      setControlsVisible(false);
      visibleRef.current = false;
    } else {
      showControls();
    }
  };

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (autoNextTimer.current) clearInterval(autoNextTimer.current);
    };
  }, []);

  // Show top bar whenever episode or season changes
  useEffect(() => {
    showControls();
  }, [currentSeason, currentEp]);

  const embedUrl = buildVideasyUrl({
    id,
    type,
    season: String(currentSeason),
    episode: String(currentEp),
  });

  // ── Orientation ────────────────────────────────────────────────────────────
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});

    const sub = ScreenOrientation.addOrientationChangeListener(evt => {
      const o = evt.orientationInfo.orientation;
      setIsLandscape(
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      );
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(sub);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'tap') { cancelAutoNext(); toggleControls(); return; }
      if (data?.type === 'episodeEnd' && type === 'tv') { startAutoNext(); return; }
      if (data?.season != null) setCurrentSeason(Number(data.season));
      if (data?.episode != null) setCurrentEp(Number(data.episode));
    } catch {
      // ignore non-JSON messages
    }
  };

  // Save to continue watching whenever season/episode changes or on first load
  useEffect(() => {
    if (!id) return;
    upsert({
      tmdbId: Number(id),
      type: type as 'movie' | 'tv',
      title: title || '',
      posterPath: posterPath || null,
      backdropPath: backdropPath || null,
      season: type === 'tv' ? currentSeason : undefined,
      episode: type === 'tv' ? currentEp : undefined,
      progress: 0,
    });
  }, [id, type, currentSeason, currentEp]);

  const handleNavStateChange = (navState: { url?: string }) => {
    if (!navState.url) return;
    try {
      const match = navState.url.match(/\/tv\/[^/]+\/(\d+)\/(\d+)/);
      if (match) {
        setCurrentSeason(Number(match[1]));
        setCurrentEp(Number(match[2]));
      }
    } catch {
      // ignore
    }
  };

  const displayTitle = title || (type === 'tv' ? `S${currentSeason}:E${currentEp}` : 'Movie');
  const topPad = isLandscape ? Spacing.sm : insets.top + Spacing.sm;
  const sidePad = isLandscape ? Math.max(insets.left, insets.right, Spacing.md) : Spacing.md;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ── WebView — fills entire screen ── */}
      <View style={styles.playerWrapper}>
        {!error ? (
          <WebView
            ref={webViewRef}
            source={{ uri: embedUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            onLoadStart={() => {
              if (!hasLoadedOnce.current) {
                setLoading(true);
                setError(false);
              }
            }}
            onLoadEnd={() => {
              hasLoadedOnce.current = true;
              setLoading(false);
            }}
            onError={() => {
              hasLoadedOnce.current = false;
              setLoading(false);
              setError(true);
            }}
            onMessage={handleMessage}
            onNavigationStateChange={handleNavStateChange}
            mixedContentMode="always"
            allowsPictureInPictureMediaPlayback
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={request => !isBlockedUrl(request.url)}
            injectedJavaScriptBeforeContentLoaded={AD_BLOCKER_BEFORE}
            injectedJavaScript={AD_BLOCKER_AFTER + `
(function() {
  // Forward episode/season changes
  window.addEventListener('message', function(e) {
    try {
      var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (d && (d.season != null || d.episode != null)) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ season: d.season, episode: d.episode }));
      }
      if (d && d.type === 'episodeEnd') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'episodeEnd' }));
      }
    } catch(err) {}
  });
  // Detect 30s before end (before credits) and full end
  function attachEnded(v) {
    if (!v || v._endAttached) return; v._endAttached = true;
    var fired = false;
    v.addEventListener('timeupdate', function() {
      if (fired || !v.duration || v.duration < 60) return;
      var remaining = v.duration - v.currentTime;
      if (remaining <= 120 && remaining > 0) {
        fired = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'episodeEnd' }));
      }
    });
    v.addEventListener('ended', function() {
      if (!fired) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'episodeEnd' }));
      }
    });
  }
  // Forward taps to toggle native top bar
  document.addEventListener('click', function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tap' }));
  }, true);
  // Force autoplay
  function tryPlay(v) {
    if (!v || v._dp) return; v._dp = true;
    attachEnded(v);
    v.muted = false;
    var p = v.play(); if (p && p.catch) p.catch(function() { v.muted = true; v.play().catch(function(){}); });
  }
  document.querySelectorAll('video').forEach(tryPlay);
  new MutationObserver(function(ms) {
    ms.forEach(function(m) { m.addedNodes.forEach(function(n) {
      if (!n || n.nodeType !== 1) return;
      if (n.tagName === 'VIDEO') tryPlay(n);
      n.querySelectorAll && n.querySelectorAll('video').forEach(tryPlay);
    }); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  true;
})();
`}
            userAgent={
              Platform.OS === 'android'
                ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
                : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            }
          />
        ) : (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={styles.errorTitle}>Couldn't load player</Text>
            <Text style={styles.errorSub}>Check your connection and try again</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                hasLoadedOnce.current = false;
                setError(false);
                setLoading(true);
                webViewRef.current?.reload();
              }}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading player…</Text>
          </View>
        )}
      </View>

      {/* ── Auto-next episode overlay ── */}
      {autoNextCountdown !== null && type === 'tv' && (
        <View style={styles.autoNextOverlay}>
          <Text style={styles.autoNextText}>Next episode in {autoNextCountdown}s</Text>
          <View style={styles.autoNextBtns}>
            <TouchableOpacity style={styles.autoNextPlayBtn} onPress={() => { cancelAutoNext(); setCurrentEp(prev => prev + 1); }}>
              <Ionicons name="play-skip-forward" size={16} color="#000" />
              <Text style={styles.autoNextPlayText}>Play Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.autoNextCancelBtn} onPress={cancelAutoNext}>
              <Text style={styles.autoNextCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Top bar ── */}
      <Animated.View
        style={[styles.topBar, { paddingTop: topPad, paddingHorizontal: sidePad, opacity: controlsOpacity }]}
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={styles.titleText} numberOfLines={1}>{displayTitle}</Text>
          {type === 'tv' && (
            <Text style={styles.epText}>Season {currentSeason} · Episode {currentEp}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            if (isLandscape) {
              ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
            } else {
              ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
            }
          }}>
          <Ionicons
            name={isLandscape ? 'phone-portrait-outline' : 'phone-landscape-outline'}
            size={20}
            color={Colors.primaryText}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // WebView fills the entire screen behind everything
  playerWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1,
  },
  webview: { flex: 1, backgroundColor: '#000' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: { ...TextStyles.bodyMedium, color: Colors.secondaryText },

  errorBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  errorTitle: { ...TextStyles.titleLarge, color: Colors.primaryText },
  errorSub: { ...TextStyles.bodyMedium, color: Colors.secondaryText, textAlign: 'center' },
  retryBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.sm,
  },
  retryText: { ...TextStyles.labelLarge, color: Colors.onPrimary },

  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
    elevation: 100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  titleBlock: { flex: 1 },
  titleText: { ...TextStyles.titleSmall, color: Colors.primaryText },
  epText: { ...TextStyles.labelSmall, color: Colors.secondaryText },
  autoNextOverlay: {
    position: 'absolute',
    bottom: 80, right: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    zIndex: 200,
    elevation: 200,
    minWidth: 200,
  },
  autoNextText: { ...TextStyles.bodyMedium, color: Colors.primaryText, textAlign: 'center' },
  autoNextBtns: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  autoNextPlayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primaryText,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.sm,
  },
  autoNextPlayText: { color: '#000', fontWeight: '700', fontSize: 13 },
  autoNextCancelBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  autoNextCancelText: { color: Colors.primaryText, fontSize: 13 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
});
