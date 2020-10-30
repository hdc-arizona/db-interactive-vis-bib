import parseBibTeX from "./parse-bibtex.js";

let allBibTeXEntries;

function toList(obj, ignore) {
  let lst = [];
  for (let key in obj) {
    if (ignore && ignore(key)) {
      continue;
    }
    lst.push({
      key: key,
      value: obj[key]
    });
  }
  return lst;
}

function textFromBibEntry(d) {
  let entryType = d.value.entryType;
  let entries = toList(d.value)
      .filter(({key}) => key !== "entryType")
      .map(({key, value}) => `  ${key} = "${value}"`).join("\n");
  return `@${entryType}{${d.key},
${entries}
}`;
}

function createDiv(sel)
{
  sel.append("div")
    .append("pre")
    .text(textFromBibEntry);
}

function updateDiv(sel)
{
  sel.select("pre")
    .text(textFromBibEntry);
}

fetch("vis-db.bib")
  .then(response => response.text())
  .then(text => {
    let entries = parseBibTeX(text);
    allBibTeXEntries = toList(entries, k => k === "@comments");
    console.log(allBibTeXEntries);
    d3.select("#bib-entries")
      .selectAll("div")
      .data(allBibTeXEntries, d => d.key)
      .enter()
      .call(createDiv);
  });

d3.select("#copy-to-clipboard")
  .on("click", d => {
    let bibText = d3.select("#bib-entries")
        .selectAll("div")
        .filter(function(d) {
          return d3.select(this).attr("visibility") !== "hidden";
        })
        .nodes().map(n => textFromBibEntry(n.__data__))    // i'm sure there exists a better way
        .join("\n\n");
    navigator.clipboard.writeText(bibText);
  });

function updateSearchText(text)
{
  let queryWords = text.toLocaleUpperCase().trim().split(" ");
  d3.select("#bib-entries")
    .selectAll("div")
    .style("display", entry => {
      let result = queryWords.map(queryWord => toList(entry.value).map(
        value => value.value.toLocaleUpperCase().search(queryWord)));
      let visible = result.every(v => v.some(a => a !== -1));
      return visible ? null : "none";
      // d.value.map(v => v.toLocaleUpperCase().search(query.
      //                                              });
    });
  return false;
}

d3.select("#search-button")
  .on("click", d => {
    let query = d3.select("#search-text").node().value;
    updateSearchText(query);
  });

d3.select("#clear-button")
  .on("click", d => {
    d3.select("#search-text").node().value = "";
    updateSearchText("");
  });

d3.select("#search-form")
  .on("submit", d => {
    let query = d3.select("#search-text").node().value;
    updateSearchText(query);
    return false;
  });

