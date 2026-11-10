# RLBPPredDB

RLBPPredDB is a static, local web application for browsing proteome-wide
R-loop-binding protein predictions and annotations. The current release
contains 37,077 reviewed UniProt records: 20,075 human proteins and 17,002
mouse proteins. Scores from the strictly curated SaProt-650M-AF2 + MLP
ensemble are available for 37,077 records (20,075 human and 17,002 mouse).
All retained human annotation records now have strict-model scores;
historical model scores are not reused.

The application runs entirely in the browser. It does not require a backend,
a database server, Node.js, or a public website deployment.

## Requirements

- Git
- Python 3
- A current desktop browser such as Chrome, Firefox, Edge, or Safari

No Python packages need to be installed.

## Run RLBPPredDB locally

Clone the repository and enter its directory:

```bash
git clone https://github.com/callmest/RLBPPredDB.git
cd RLBPPredDB
```

Start a local HTTP server bound to your own computer only.

macOS or Linux:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Windows:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Then open the following address in a browser:

```text
http://127.0.0.1:8000/
```

The annotation browser is available directly at:

```text
http://127.0.0.1:8000/annotation.html
```

Stop the server by returning to the terminal and pressing `Ctrl+C`.

> Do not open `index.html` directly with a `file://` URL. The annotation page
> loads `rlbp_annotations.json` with the browser Fetch API, which requires the
> files to be served over HTTP.

## Verify the installation

After the page opens, the Annotation page should report:

```text
Loaded 37,077 records | Scored 37,077
```

As a functional check, search for `P11387`, select `Human`, set the minimum
prediction score to `0.98`, and enable `Exact UniProt ID`. The expected result
is TOP1 with an RLBPPred prediction score of `0.999990`.

For the manuscript browsing example, search for `DNA topoisomerase`, select
`Human`, set the minimum score to `0.98`, disable exact-ID matching, and sort
scores from high to low. Six records are returned, in this order: TOP2B,
TOP2A, TOP1, TOPBP1, TOP3A, and TOP3B. This illustrates database retrieval,
not six newly discovered candidates: only TOP3B belongs to the 401-protein
untrained-pool candidate set.

The packaged JSON data can also be checked from the repository root:

```bash
python3 - <<'PY'
import collections
import json

with open("rlbp_annotations.json", encoding="utf-8") as handle:
    records = json.load(handle)

counts = collections.Counter(row["species"] for row in records)
top1 = next(row for row in records if row["uniprot_id"] == "P11387")

print(f"Total: {len(records):,}")
print(f"Human: {counts['Human']:,}")
print(f"Mouse: {counts['Mouse']:,}")
print(f"Scored: {sum(row['confidence'] is not None for row in records):,}")
print(f"Not scored: {sum(row['confidence'] is None for row in records):,}")
print(f"TOP1 prediction score: {float(top1['confidence']):.6f}")
PY
```

Expected output:

```text
Total: 37,077
Human: 20,075
Mouse: 17,002
Scored: 37,077
Not scored: 0
TOP1 prediction score: 0.999990
```

## Repository contents

| File | Purpose |
|---|---|
| `index.html` | Home page |
| `annotation.html` | Search and filtering interface |
| `annotation.js` | Client-side loading, filtering, sorting, and pagination |
| `data-access.html` | Download links and data notes |
| `help.html` | Usage guidance |
| `style.css` | Website styling |
| `rlbp_annotations.json` | Runtime annotation database used by the browser |
| `rlbp_annotations.csv` | Downloadable tabular export of the runtime database |
| `rlbp_prediction_template.csv` | Prediction-input template |
| `PUBLIC_MANIFEST.sha256` | SHA-256 checksums for the packaged public files |

All paths used by the application are relative to the repository root. The
site therefore works on any local port as long as all files remain together.

## Search and filtering

The Annotation page supports:

- keyword searches across UniProt accession, gene names, protein names,
  functional annotations, and gene descriptions;
- exact UniProt accession matching;
- human or mouse filtering;
- reviewed-status and minimum-prediction-score filtering;
- prediction-score, sequence-length, and UniProt-accession sorting; and
- paginated browsing with 20, 50, or 100 rows per page.

The full JSON file is approximately 26 MB and is loaded into browser memory.
Initial loading may therefore take several seconds on slower computers.
Internet access is not required to browse or filter the packaged data; it is
needed only when following external UniProt links.

Unscored records remain visible when the minimum score is blank or zero.
A positive minimum excludes unscored records. In both ascending and descending
score sorts, unscored records appear after scored records. A missing score is
not a zero score or a negative prediction.

## Prediction provenance and interpretation

Scores are the mean output probabilities from a 300-member SaProt-650M-AF2 +
MLP ensemble trained on the strictly curated human benchmark (376 positives
and 9,109 negatives). Each member was trained using the 301 training positives
and 301 randomly sampled training negatives; the 75 positive and 1,821 negative
held-out proteins were not used for model fitting. The protein encoder was
frozen, and member probabilities were combined by soft voting. The same frozen
ensemble was applied to mouse proteins without retraining.

Human candidate discovery uses a score of at least `0.98`, selected to meet
an empirical FPR target of at most `0.1%` on held-out human negatives. One of
1,821 held-out negatives exceeded this threshold (observed FPR `0.0549%`).
This rule yields 401 candidates within the 5,640-protein untrained human pool.
The complete scored human collection has 1,344 records at or above `0.98`,
including known and potential positives; it is not the 401-candidate set.
The 14-field browser table does not encode these evidence-group labels.

Prediction scores support prioritization and do not establish direct R-loop
binding or experimentally calibrated probabilities. The human FPR target
has not been established for mouse proteins, for which species-specific
threshold calibration is required.

## Data notes

The runtime JSON and CSV contain 14 annotation and prediction fields. Protein
sequences are not included in these browser-facing files. The existing field
name `confidence` is retained for compatibility and stores the prediction score
at full precision; the interface displays six decimal places. Unscored records
use JSON `null` or a blank CSV cell. Annotation fields and record order are
unchanged by the score update. UniProt records and other third-party annotations
remain subject to their respective source terms.

## Related code

The model-training, evaluation, analysis, figure-reproduction, and
database-construction scripts are available in the
[RLBPPred-paper-code reproducibility repository](https://github.com/callmest/RLBPPred-paper-code).
The standalone prediction package and command-line FASTA workflow are
maintained separately in the [RLBPPred repository](https://github.com/callmest/RLBPPred).

## License

Original website code and documentation are released under the terms in
[`LICENSE`](LICENSE). Third-party data retain their original attribution and
licensing requirements.
