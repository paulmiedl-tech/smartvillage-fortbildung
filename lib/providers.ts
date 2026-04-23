/**
 * Provider domain allowlist and URL normalization.
 *
 * The LLM is free to recommend ANY high-quality, reputable provider. This
 * module only decides whether a URL it produces becomes a clickable link
 * (normalized to the provider homepage) or gets stripped to plaintext.
 *
 * Architectural rationale:
 *   LLMs cannot verify URLs. Deep-links rot. Vertex AI Search returns
 *   redirect URLs. Trying to enforce link integrity via prompt text is a
 *   losing battle. Instead we treat provider-homepage links as a trust
 *   layer: an LLM-produced URL is clickable only if its hostname matches
 *   a curated allowlist of established training domains, and we always
 *   link to the root of that domain (never the specific course path).
 *
 * Result: zero 404s on clickable links. Recommendations for unknown
 *   providers remain useful (name + description + funding status), the
 *   provider name simply renders as plaintext instead of a hyperlink.
 *
 * Maintenance: this list is intentionally broad. Add new trusted
 *   suffixes here; no prompt change required.
 */

/**
 * Second-level or higher suffixes we trust. A URL's hostname is trusted
 * when it equals the suffix or ends with "." + suffix. This catches
 * all regional IHK subdomains (akademie.muenchen.ihk.de, etc.) while
 * rejecting look-alikes (fakeihk.de).
 */
const ALLOWED_DOMAIN_SUFFIXES: readonly string[] = [
  // Kammern und öffentliche Träger
  "ihk.de",
  "ihk-akademie.de",
  "hwk.de",
  "handwerkskammer.de",

  // Volkshochschulen (bundesweit + Länder-/Stadtportale)
  "vhs.de",
  "volkshochschule.de",
  "koelner-vhs.de",
  "vhs-ebersberger-land.de",
  "vhs-esslingen.de",
  "vhs-nord.de",
  "vhs-muenchen.de",
  "vhs-berlin.de",
  "vhs-stuttgart.de",
  "vhs-frankfurt.de",
  "vhs-hamburg.de",
  "vhs-duesseldorf.de",

  // Etablierte Akademien
  "haufe-akademie.de",
  "management-circle.de",
  "beck-akademie.de",
  "dekra-akademie.de",
  "refa.de",
  "steinbeis.de",
  "steinbeis-smi.de",
  "fraunhofer.de",
  "dgfp.de",

  // TÜV-Gruppe
  "tuv.com",
  "tuev-nord.de",
  "tuev-sued.de",
  "tuv-sued.de",
  "tuv-rheinland.de",
  "tuev-rheinland.de",

  // Fernschulen und Fernhochschulen
  "ils.de",
  "sgd.de",
  "diploma.de",
  "euro-fh.de",
  "wbstraining.de",
  "srh-fernhochschule.de",
  "iu.de",
  "apollon-hochschule.de",

  // Hochschulen (Top-Universitäten und technische)
  "tum.de",
  "rwth-aachen.de",
  "tu-berlin.de",
  "hu-berlin.de",
  "fu-berlin.de",
  "tu-darmstadt.de",
  "tu-dresden.de",
  "tu-muenchen.de",
  "kit.edu",
  "uni-muenchen.de",
  "lmu.de",
  "uni-heidelberg.de",
  "uni-hamburg.de",
  "uni-koeln.de",
  "uni-bonn.de",
  "uni-goettingen.de",
  "uni-stuttgart.de",
  "uni-mannheim.de",
  "fau.de",
  "uni-erlangen.de",
  "uni-wuerzburg.de",
  "uni-regensburg.de",
  "hsg.ch",
  "unisg.ch",
  "eth.ch",
  "ethz.ch",

  // Fachhochschulen (Beispiele, erweiterbar)
  "frankfurt-university.de",
  "th-koeln.de",
  "th-nuernberg.de",
  "hs-augsburg.de",
  "hs-muenchen.de",
  "hs-anhalt.de",

  // Internationale Lernplattformen
  "coursera.org",
  "edx.org",
  "futurelearn.com",
  "udemy.com",
  "linkedin.com",
  "skillshare.com",
  "udacity.com",

  // Hersteller-Zertifizierungsprogramme
  "hubspot.com",
  "learn.microsoft.com",
  "microsoft.com",
  "aws.amazon.com",
  "trailhead.salesforce.com",
  "salesforce.com",
  "scrum.org",
  "pmi.org",
  "axelos.com",
  "cisco.com",
  "networkingacademy.com",
  "redhat.com",
  "oracle.com",
  "sap.com",
  "google.com",
  "skillshop.exceedlms.com",
  "skillshop.withgoogle.com",
  "exceedlms.com",
  "atlassian.com",
  "meta.com",
  "facebookblueprint.com",

  // Behörden, Förderportale, Weiterbildungsverzeichnisse
  "arbeitsagentur.de",
  "kursnet.arbeitsagentur.de",
  "bildungsurlaub.de",
  "vbg.de",
  "service.vbg.de",
  "bafa.de",
  "foerderdatenbank.de",
  "kursfinder.de",
  "weiterbildungsdatenbank.de",
  "wb-web.de",
  "stifterverband.org",

  // Weitere etablierte Fachanbieter und Branchen-Plattformen
  "oose.de",
  "sigs-datacom.de",
  "iml.fraunhofer.de",
  "gi.de",
  "ey.com",
  "pwc.com",
  "deloitte.com",
  "kpmg.com",
  "bitkom.org",
  "bitkom-akademie.de",

  // Fortbildungs-Aggregatoren mit Qualitätsanspruch
  "fortbildung24.com",
  "semigator.de",
];

/**
 * Strip URL to its homepage form if the hostname is trusted.
 *
 * Returns:
 *   - A normalized URL string (e.g. "https://www.haufe-akademie.de/")
 *     when the hostname matches an allowed suffix
 *   - `null` when the URL is invalid, a Vertex Search redirect, or
 *     the hostname is not on the allowlist (caller renders plaintext)
 *
 * @example
 *   normalizeProviderUrl("https://www.haufe-akademie.de/seminar/abc/123?utm=x")
 *   → "https://www.haufe-akademie.de/"
 *
 *   normalizeProviderUrl("https://vertexaisearch.cloud.google.com/grounding-api-redirect/...")
 *   → null  (redirect URLs never clickable)
 *
 *   normalizeProviderUrl("https://fake-coach-xyz.com/guru")
 *   → null  (not on allowlist)
 */
export function normalizeProviderUrl(rawUrl: string | undefined | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  // Reject Vertex AI Search grounding redirects. These are unstable,
  // ugly, and route every click through Google's grounding infrastructure.
  if (url.hostname === "vertexaisearch.cloud.google.com") return null;

  const host = url.hostname.toLowerCase();

  const trusted = ALLOWED_DOMAIN_SUFFIXES.some((suffix) => {
    return host === suffix || host.endsWith("." + suffix);
  });

  if (!trusted) return null;

  // Preserve the full hostname (so regional IHK subdomains stay intact)
  // but strip path and query — we only link to the domain root to avoid
  // any chance of 404 on a specific course page.
  return `https://${url.hostname}/`;
}

/**
 * Friendly display label for a normalized URL. Strips the leading "www."
 * for a cleaner visual when the hostname itself is used as link text.
 */
export function displayHostname(normalizedUrl: string): string {
  try {
    return new URL(normalizedUrl).hostname.replace(/^www\./, "");
  } catch {
    return normalizedUrl;
  }
}
