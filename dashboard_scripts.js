require([
  "splunkjs/mvc",
  "splunkjs/mvc/simplexml/ready!",
  "splunkjs/mvc/tokenutils",
], function(mvc, ready, TokenUtils) {
  const tokens = mvc.Components.getInstance("submitted");

  const codeBlock1 = `
    source="HW5FortifyOC.csv" sourcetype="csv" Application="$selected_app$" Severity="$selected_severity$" "Is Suppressed"="$selected_suppressed$" SIM_Closed_Status="$selected_closed$"
| eval SIM_Open_Date_converted=strptime(SIM_Open_Date, "%m/%d/%Y")
| stats count(eval(SIM_Closed_Status="OPEN")) as Open_Count by SIM_Open_Date_converted
| eval Date=SIM_Open_Date_converted
| append
 [| search source="HW5FortifyOC.csv" sourcetype="csv"
  | eval SIM_Closed_Date_converted=strptime(SIM_Closed_Date, "%m/%d/%Y")
  | stats count(eval(SIM_Closed_Status="OPEN")) as Closed_Count by SIM_Closed_Date_converted
  | eval Date=SIM_Closed_Date_converted]
| fillnull value=0 Open_Count Closed_Count
| stats sum(Open_Count) as Open_Count, sum(Closed_Count) as Closed_Count by Date
| eval Formatted_Date=strftime(Date, "%m/%d/%Y")
| table Formatted_Date, Open_Count, Closed_Count
| sort Formatted_Date
  `;

  const codeBlock2 = `
    source="HW5FortifyOC.csv" sourcetype="csv" Application="$selected_app$" Severity="$selected_severity$" "Is Suppressed"="$selected_suppressed$" SIM_Closed_Status="$selected_closed$"
| eval SIM_Open_Date_converted=strptime(SIM_Open_Date, "%m/%d/%Y")
| stats count(eval(SIM_Closed_Status="OPEN")) as Open_Count by SIM_Open_Date_converted
| eval Date=SIM_Open_Date_converted
| append
 [| search source="HW5FortifyOC.csv" sourcetype="csv"
  | eval SIM_Closed_Date_converted=strptime(SIM_Closed_Date, "%m/%d/%Y")
  | stats count(eval(SIM_Closed_Status="CLOSED")) as Closed_Count by SIM_Closed_Date_converted
  | eval Date=SIM_Closed_Date_converted]
| fillnull value=0 Open_Count Closed_Count
| stats sum(Open_Count) as Open_Count, sum(Closed_Count) as Closed_Count by Date
| eval Formatted_Date=strftime(Date, "%m/%d/%Y")
| table Formatted_Date, Open_Count, Closed_Count
| sort Formatted_Date
  `;

  function updateSearch(selected_closed) {
    let updatedQuery;
    if (selected_closed === "OPEN") {
      updatedQuery = TokenUtils.replaceTokenNames(codeBlock1, tokens.attributes, {escapeQuotes: false});
    } else {
      updatedQuery = TokenUtils.replaceTokenNames(codeBlock2, tokens.attributes, {escapeQuotes: false});
    }

    const chartElement = mvc.Components.getInstance("dynamic_chart");
    const searchManager = chartElement.settings.get("managerid");
    const search = mvc.Components.getInstance(searchManager);

    // Update the search query
    search.settings.unset("search");
    search.settings.set("search", updatedQuery);

    // Trigger a new search
    search.startSearch();
  }

  // Initial update of the search
  updateSearch(tokens.get("selected_closed"));

  // Listen for changes to the selected_closed token
  tokens.on("change:selected_closed", function() {
    updateSearch(tokens.get("selected_closed"));
  });
  tokens.on("change:selected_app", updateSearch);
  tokens.on("change:selected_severity", updateSearch);
  tokens.on("change:selected_suppressed", updateSearch);
});
