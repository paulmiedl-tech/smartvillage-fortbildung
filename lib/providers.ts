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
  // === DE: Kammern und öffentliche Träger ===
  "ihk.de",                       // catch-all für akademie.<stadt>.ihk.de Subdomains
  "ihk-akademie.de",
  // Regionale IHKs mit eigener Top-Level-Domain (keine .ihk.de Subdomain)
  "ihk-berlin.de",
  "ihk-muenchen.de",
  "ihk-koeln.de",
  "ihk-frankfurt.de",
  "frankfurt-main.ihk.de",
  "ihk-stuttgart.de",
  "ihk-hamburg.de",
  "ihk-duesseldorf.de",
  "ihk-nuernberg.de",
  "ihk-hannover.de",
  "ihk-dresden.de",
  "ihk-leipzig.de",
  "ihk-bremen.de",
  "ihk-saarland.de",
  "ihk-schwaben.de",
  "ihk-nordwestfalen.de",
  "ihk-rhein-neckar.de",
  "hwk.de",
  "handwerkskammer.de",

  // === DE: Volkshochschulen (bundesweit + Städte) ===
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
  "vhs-bremen.de",
  "vhs-leipzig.de",
  "vhs-dresden.de",
  "vhs-hannover.de",
  "vhs-nuernberg.de",

  // === DE: Etablierte Akademien und Weiterbildungsinstitute ===
  "haufe-akademie.de",
  "management-circle.de",
  "beck-akademie.de",
  "dekra-akademie.de",
  "refa.de",
  "steinbeis.de",
  "steinbeis-smi.de",
  "fraunhofer.de",
  "iml.fraunhofer.de",
  "dgfp.de",
  "dgq.de",                      // Deutsche Gesellschaft für Qualität
  "gi.de",                        // Gesellschaft für Informatik
  "bitkom.org",
  "bitkom-akademie.de",

  // === DE: TÜV-Gruppe ===
  "tuv.com",
  "tuev-nord.de",
  "tuv-nord.com",
  "tuev-sued.de",
  "tuv-sued.de",
  "tuv-rheinland.de",
  "tuev-rheinland.de",

  // === DE: Fernschulen und Fernhochschulen ===
  "ils.de",
  "sgd.de",
  "diploma.de",
  "euro-fh.de",
  "wbstraining.de",
  "srh-fernhochschule.de",
  "iu.de",                        // IU Internationale Hochschule
  "iubh.de",
  "iubh-fernstudium.de",
  "apollon-hochschule.de",
  "fernuni-hagen.de",             // FernUniversität in Hagen (staatlich)
  "fom.de",                       // FOM Hochschule
  "akad.de",                      // AKAD Hochschule
  "wb-fernstudium.de",
  "wilhelmbuechner.de",           // Wilhelm Büchner Hochschule
  "hfh-fernstudium.de",           // Hamburger Fern-Hochschule

  // === DE: Universitäten ===
  "tum.de",
  "rwth-aachen.de",
  "tu-berlin.de",
  "hu-berlin.de",
  "fu-berlin.de",
  "tu-darmstadt.de",
  "tu-dresden.de",
  "tu-muenchen.de",
  "tu-chemnitz.de",
  "tu-braunschweig.de",
  "tu-ilmenau.de",
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
  "uni-konstanz.de",
  "uni-freiburg.de",
  "uni-tuebingen.de",
  "uni-jena.de",
  "uni-leipzig.de",
  "uni-potsdam.de",
  "uni-bielefeld.de",
  "uni-duisburg-essen.de",
  "uni-muenster.de",
  "fau.de",
  "uni-erlangen.de",
  "uni-wuerzburg.de",
  "uni-regensburg.de",
  "uni-passau.de",
  "uni-mainz.de",
  "uni-trier.de",

  // === DE: Fachhochschulen ===
  "frankfurt-university.de",
  "th-koeln.de",
  "th-nuernberg.de",
  "th-deggendorf.de",
  "hs-augsburg.de",
  "hs-muenchen.de",
  "hs-anhalt.de",
  "hs-mannheim.de",
  "hs-karlsruhe.de",
  "hs-pforzheim.de",
  "hs-esslingen.de",
  "hs-hannover.de",
  "hs-bremen.de",
  "hs-osnabrueck.de",
  "fh-aachen.de",
  "fh-bielefeld.de",
  "fh-muenster.de",
  "fh-dortmund.de",
  "hda.de",                       // Hochschule Darmstadt
  "haw-hamburg.de",               // Hochschule für Angewandte Wissenschaften
  "hs-neu-ulm.de",

  // === DE: Business Schools und Executive Education ===
  "whu.edu",                      // WHU Otto Beisheim
  "esmt.org",                     // ESMT Berlin
  "esmt.berlin",
  "mannheim-business-school.com",
  "mannheim-business-school.de",
  "frankfurt-school.de",          // Frankfurt School of Finance
  "hhl.de",                       // HHL Leipzig Graduate School
  "kuehne-logistics.com",         // KLU Hamburg
  "hsba.de",                      // Hamburg School of Business Administration
  "zeppelin-university.de",
  "provadis-hochschule.de",

  // === DE: Innovations-/Tech-Schulen ===
  "openhpi.de",                   // Hasso-Plattner-Institut MOOCs
  "hpi.de",
  "iversity.org",
  "42berlin.de",
  "42wolfsburg.de",
  "42heilbronn.de",
  "neuefische.de",
  "masterschool.com",
  "spiced-academy.com",           // SPICED Academy
  "code.berlin",                  // CODE University of Applied Sciences
  "le-wagon.com",
  "lewagon.com",
  "careerfoundry.com",
  "ironhack.com",
  "techlabs.io",

  // === AT / CH: Hochschulen und Business Schools ===
  "hsg.ch",                       // Uni St. Gallen
  "unisg.ch",
  "eth.ch",
  "ethz.ch",
  "epfl.ch",
  "uzh.ch",                       // Uni Zürich
  "unibe.ch",                     // Uni Bern
  "zhaw.ch",
  "fhnw.ch",
  "wu.ac.at",                     // Wirtschaftsuniversität Wien
  "tuwien.ac.at",
  "univie.ac.at",
  "uibk.ac.at",                   // Uni Innsbruck
  "jku.at",                       // Johannes Kepler Linz

  // === International: Top-Universitäten mit Online-Angeboten ===
  "mit.edu",                      // MIT (inkl. OCW und xPRO)
  "ocw.mit.edu",
  "mitxpro.mit.edu",
  "stanford.edu",
  "online.stanford.edu",
  "harvard.edu",
  "extension.harvard.edu",
  "pll.harvard.edu",
  "hbs.edu",                      // Harvard Business School
  "oxford.ac.uk",
  "ox.ac.uk",
  "sbs.ox.ac.uk",                 // Saïd Business School
  "cam.ac.uk",
  "jbs.cam.ac.uk",                // Judge Business School
  "imperial.ac.uk",
  "ucl.ac.uk",
  "lse.ac.uk",
  "kcl.ac.uk",
  "ed.ac.uk",                     // Edinburgh
  "man.ac.uk",                    // Manchester
  "warwick.ac.uk",
  "berkeley.edu",
  "extension.berkeley.edu",
  "yale.edu",
  "som.yale.edu",
  "princeton.edu",
  "cornell.edu",
  "ecornell.com",                 // Cornell online
  "columbia.edu",
  "caltech.edu",
  "cmu.edu",                      // Carnegie Mellon
  "chicago.edu",
  "northwestern.edu",
  "kellogg.northwestern.edu",
  "nyu.edu",
  "stern.nyu.edu",
  "upenn.edu",
  "wharton.upenn.edu",
  "online.wharton.upenn.edu",
  "duke.edu",
  "fuqua.duke.edu",
  "umich.edu",                    // University of Michigan
  "ross.umich.edu",
  "utexas.edu",
  "uchicago.edu",
  "booth.uchicago.edu",
  "utoronto.ca",
  "ubc.ca",
  "mcgill.ca",

  // === International: Business Schools ===
  "insead.edu",
  "hec.edu",
  "lbs.edu",                      // London Business School
  "ie.edu",                       // IE Business School
  "iese.edu",
  "escp.eu",
  "essec.edu",
  "imd.org",                      // IMD Lausanne
  "sdabocconi.it",                // SDA Bocconi
  "esade.edu",

  // === Internationale Lernplattformen (MOOCs, Corporate Learning) ===
  "coursera.org",
  "edx.org",
  "futurelearn.com",
  "udemy.com",
  "linkedin.com",                 // deckt learning.linkedin.com
  "skillshare.com",
  "udacity.com",
  "pluralsight.com",
  "datacamp.com",
  "codecademy.com",
  "khanacademy.org",
  "oreilly.com",                  // O'Reilly Learning
  "masterclass.com",
  "domestika.org",
  "frontendmasters.com",
  "egghead.io",
  "acloudguru.com",               // jetzt Pluralsight, URL existiert
  "interaction-design.org",       // IxDF
  "teamtreehouse.com",
  "maven.com",                    // Maven cohort courses
  "reforge.com",                  // Reforge (Product Management)
  "section.com",                  // Section (Scott Galloway)

  // === Hersteller-Zertifizierungsprogramme ===
  "hubspot.com",
  "academy.hubspot.com",
  "learn.microsoft.com",
  "microsoft.com",
  "aws.amazon.com",
  "aws.training",
  "amazon.com",
  "salesforce.com",
  "trailhead.salesforce.com",
  "google.com",
  "skillshop.exceedlms.com",
  "skillshop.withgoogle.com",
  "cloudskillsboost.google",
  "cloud.google.com",
  "exceedlms.com",
  "scrum.org",
  "scrumalliance.org",
  "pmi.org",
  "axelos.com",
  "peoplecert.org",
  "cisco.com",
  "networkingacademy.com",
  "redhat.com",
  "oracle.com",
  "mylearn.oracle.com",
  "sap.com",
  "learning.sap.com",
  "atlassian.com",
  "university.atlassian.com",
  "meta.com",
  "facebookblueprint.com",
  "adobe.com",
  "learn.adobe.com",
  "github.com",                   // GitHub Skills / GitHub Learning Lab
  "linuxfoundation.org",
  "training.linuxfoundation.org",
  "docker.com",
  "kubernetes.io",
  "cncf.io",
  "hashicorp.com",
  "developer.hashicorp.com",
  "databricks.com",
  "academy.databricks.com",
  "snowflake.com",
  "university.mongodb.com",
  "mongodb.com",
  "elastic.co",
  "confluent.io",
  "kaggle.com",
  "nvidia.com",
  "learn.nvidia.com",
  "isaca.org",
  "comptia.org",
  "iseb.org",
  "isqi.org",
  "ipma.ch",                      // International Project Management Association

  // === Design / Kreativ / Produkt ===
  "figma.com",
  "behance.net",
  "canva.com",
  "invisionapp.com",
  "miro.com",

  // === Behörden, Förderportale, Weiterbildungsverzeichnisse ===
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
  "bmwk.de",                      // Bundeswirtschaftsministerium
  "bmbf.de",                      // Bundesbildungsministerium

  // === Weitere etablierte Fachanbieter ===
  "oose.de",
  "sigs-datacom.de",
  "pc-college.de",                // PC-COLLEGE, IT-Trainer seit 1984
  "vsb-bildungswerk.de",          // VSB Bildungswerk (Köln/NRW)
  "bitkom-research.de",
  "dbb-akademie.de",              // dbb akademie
  "gfs-akademie.de",
  "gpm-ipma.de",                  // GPM / IPMA Projektmanagement
  "vde.com",
  "vdi.de",
  "iqb.de",
  "new-elements.de",              // New Elements IT-Training
  "ey.com",
  "pwc.com",
  "deloitte.com",
  "kpmg.com",
  "bcg.com",
  "mckinsey.com",
  "accenture.com",
  "capgemini.com",
  "bearingpoint.com",

  // === Fortbildungs-Aggregatoren mit Qualitätsanspruch ===
  "fortbildung24.com",
  "semigator.de",
  "edukatico.org",
];

/**
 * Normalize a provider URL for trusted domains.
 *
 * Returns:
 *   - Full URL with path preserved (query + fragment stripped) when
 *     the hostname matches an allowed suffix
 *   - `null` when the URL is invalid, a Vertex Search redirect, or
 *     the hostname is not on the allowlist (caller renders Google
 *     search fallback)
 *
 * Two-stage trust model for path preservation:
 *   1. Hostname must be on the static allowlist (ALLOWED_DOMAIN_SUFFIXES)
 *   2. If `groundedHostnames` is provided (the set of hostnames that
 *      Google Search Grounding actually returned in the current
 *      response), the hostname must also be in that set to keep the
 *      path. If the hostname is on the allowlist but NOT in the
 *      grounded set, the URL is likely a model-hallucinated deep-link
 *      reconstructed from training knowledge. We defensively strip to
 *      the provider homepage in that case — the user still lands on
 *      a live page of the right provider, just not the specific course.
 *
 * When `groundedHostnames` is undefined, path preservation applies to
 * any allowlisted URL (legacy behaviour, e.g. unit tests or contexts
 * without grounding data).
 *
 * @example
 *   // Grounded link — preserve path
 *   normalizeProviderUrl(
 *     "https://www.haufe-akademie.de/seminar/abc/123?utm=x",
 *     new Set(["haufe-akademie.de"])
 *   )
 *   → "https://www.haufe-akademie.de/seminar/abc/123"
 *
 *   // Allowlisted hostname but NOT in grounded set → strip to homepage
 *   normalizeProviderUrl(
 *     "https://www.haufe-akademie.de/seminar/fantasy-course",
 *     new Set(["ihk-akademie-muenchen.de"])
 *   )
 *   → "https://www.haufe-akademie.de/"
 *
 *   normalizeProviderUrl("https://vertexaisearch.cloud.google.com/...")
 *   → null
 *
 *   normalizeProviderUrl("https://fake-coach-xyz.com/guru")
 *   → null
 */
export function normalizeProviderUrl(
  rawUrl: string | undefined | null,
  groundedHostnames?: ReadonlySet<string>,
): string | null {
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

  const allowlisted = ALLOWED_DOMAIN_SUFFIXES.some((suffix) => {
    return host === suffix || host.endsWith("." + suffix);
  });

  if (!allowlisted) return null;

  // Check grounding trust if a source set was provided.
  if (groundedHostnames && groundedHostnames.size > 0) {
    const bareHost = host.replace(/^www\./, "");
    const isGrounded = Array.from(groundedHostnames).some((sourceHost) => {
      const sourceBare = sourceHost.replace(/^www\./, "");
      return (
        bareHost === sourceBare ||
        bareHost.endsWith("." + sourceBare) ||
        sourceBare.endsWith("." + bareHost)
      );
    });
    if (!isGrounded) {
      // Allowlisted hostname but not surfaced by Grounding — the deep-link
      // was likely reconstructed from the model's training knowledge and
      // may not actually exist. Strip to the homepage to avoid 404s.
      return `${url.protocol}//${url.hostname}/`;
    }
  }

  // Keep path (the course identifier). Strip query and fragment — these
  // are tracking/anchor artifacts and often signal unstable campaign URLs.
  const path = url.pathname === "" ? "/" : url.pathname;
  return `${url.protocol}//${url.hostname}${path}`;
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
