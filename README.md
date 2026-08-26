# RLBPPredDB

RLBPPredDB is a static, local web application for browsing proteome-wide
R-loop-binding protein predictions and annotations. The current release
contains 37,077 reviewed UniProt records: 20,075 human proteins and 17,002
mouse proteins.

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
Loaded 37,077 records
```

As a functional check, search for `P11387`, select `Human`, set the minimum
confidence to `0.85`, and enable `Exact UniProt ID`. The expected result is
TOP1 with an RLBPPred confidence of `0.999743`.

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
print(f"TOP1 confidence: {float(top1['confidence']):.6f}")
PY
```

Expected output:

```text
Total: 37,077
Human: 20,075
Mouse: 17,002
TOP1 confidence: 0.999743
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

All paths used by the application are relative to the repository root. The
site therefore works on any local port as long as all files remain together.

## Search and filtering

The Annotation page supports:

- keyword searches across UniProt accession, gene names, protein names,
  functional annotations, and gene descriptions;
- exact UniProt accession matching;
- human or mouse filtering;
- reviewed-status and minimum-confidence filtering;
- confidence, sequence-length, and UniProt-accession sorting; and
- paginated browsing with 20, 50, or 100 rows per page.

The full JSON file is approximately 26 MB and is loaded into browser memory.
Initial loading may therefore take several seconds on slower computers.
Internet access is not required to browse or filter the packaged data; it is
needed only when following external UniProt links.

## Data notes

The runtime JSON and CSV contain 14 annotation and prediction fields. Protein
sequences are not included in these browser-facing files. UniProt records and
other third-party annotations remain subject to their respective source terms.

## Related code

The model-training, analysis, figure-reproduction, and database-construction
scripts are available in the
[RLBPPred reproducibility repository](https://github.com/callmest/RLBPPred).

## License

Original website code and documentation are released under the terms in
[`LICENSE`](LICENSE). Third-party data retain their original attribution and
licensing requirements.
