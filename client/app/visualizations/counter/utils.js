import { isNumber, isFinite, toString, invoke } from "lodash";
import numeral from "numeral";
import { formatSimpleTemplate } from "@/lib/value-format";
import counterTypes from "./counterTypes";

function formatValue(value, { numberFormat, stringDecChar, stringThouSep }) {
  if (!isNumber(value)) {
    return toString(value);
  }

  // Temporarily update locale data (restore defaults after formatting)
  const locale = numeral.localeData();
  const savedDelimiters = locale.delimiters;

  if (stringDecChar || stringThouSep) {
    locale.delimiters = {
      thousands: stringThouSep,
      decimal: stringDecChar || ".",
    };
  }
  const result = numeral(value).format(numberFormat);

  locale.delimiters = savedDelimiters;
  return result;
}

function getCounterValue(rows, valueOptions, counterOptions) {
  const value = invoke(counterTypes[valueOptions.type], "getValue", rows, valueOptions);

  const formatData = {
    "@@raw": toString(value),
    "@@formatted": isFinite(value) ? formatValue(value, counterOptions) : toString(value),
    // TODO: use row fields if available
  };

  const display = formatSimpleTemplate(valueOptions.displayFormat, formatData);
  const tooltip = valueOptions.showTooltip ? formatSimpleTemplate(valueOptions.tooltipFormat, formatData) : null;

  return {
    value,
    display: display !== "" ? display : null,
    tooltip: tooltip !== "" ? tooltip : null,
  };
}

export function getCounterData(rows, options, visualizationName) {
  const result = {};
  const rowsCount = rows.length;
  const { counterType = "rowValue", counterLabel } = options;

  if (rowsCount > 0 || counterType === "countRows") {
    result.counterLabel = counterLabel || visualizationName;

    result.primaryValue = getCounterValue(rows, options.primaryValue, options);
    result.secondaryValue = getCounterValue(rows, options.secondaryValue, options);

    // TODO: Make this logic configurable
    result.showTrend = false;
    if (isFinite(result.primaryValue.value) && isFinite(result.secondaryValue.value)) {
      const delta = result.primaryValue.value - result.secondaryValue.value;
      result.showTrend = true;
      result.trendPositive = delta >= 0;
    }
  }

  return result;
}
