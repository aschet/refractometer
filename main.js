// Copyright (c) 2021 Thomas Ascher
// SPDX-License-Identifier: MIT

function correctBx(bx, wcf) {
    return bx / wcf;
}

// Alcohol content estimation and Plato/SG conversion implemented according to:
// G. Spedding. "Alcohol and Its Measurement". In: Brewing Materials and Processes. Elsevier,
// 2016, S. 123-149. DOI: 10.1016/b978-0-12-799954-8.00007-1.

function sgToP(sg) {
    return sg**2 * -205.347 + 668.72 * sg - 463.37;
}

function pToSG(p) {
    return p / (258.6 - (p / 258.2 * 227.1)) + 1.0;
}

function calcRE(oe, ae) {
    return 0.1948 * oe + 0.8052 * ae;
}

function calcABW(oe, re) {
    return (oe - re) / (2.0665 - (1.0665 * oe / 100.0));
}

function calcABV(abw, fg) {
    return abw * fg / 0.7907;
}

// Degree of fermentation calculation implemented according to:
// Alex Speers. Brewing Calculations. 2015.
// URL: https://chme.nmsu.edu/files/2017/03/FeatAug15.pdf

function calcADF(oe, ae) {
    return (oe - ae) * 100.0 / oe;
}

function calcRDF(oe, re) {
    return ((oe - re) * 100.0 / oe) * (1 / (1 - 0.005161 * re));
}

// Bonham (Standard) correlation function implemented according to:
// Louis K. Bonham. "The Use of Handheld Refractometers by Homebrewers".
// In: Zymurgy 24.1 (2001), S. 43-46.

function corBonham(bxi, bxf, wcf) {
    oe = correctBx(bxi, wcf);
    fg = 1.001843 - 0.002318474 * oe - 0.000007775 * oe**2 -
        0.000000034 * oe**3 + 0.00574 * bxf +
        0.00003344 * bxf**2 + 0.000000086 * bxf**3;
    return [oe, sgToP(fg), fg];
}

// Gardner correlation function implemented according to:
// Louis K. Bonham. "The Use of Handheld Refractometers by Homebrewers".
// In: Zymurgy 24.1 (2001), S. 43-46.

function corGardner(bxi, bxf, wcf) {
    oe = correctBx(bxi, wcf);
    ae = 1.53 * bxf - 0.59 * oe;
    return [oe, ae, pToSG(ae)];
}

// Gossett correlation function implemented according to:
// James M. Gossett. Derivation and Explanation of the Brix-Based Calculator For Estimating
// ABV in Fermenting and Finished Beers. 2012.
// URL: http://www.ithacoin.com/brewing/Derivation.htm

function abwGosett(bxi, bxf, wcf) {
    k = 0.445;
    c = 100.0 * (bxi - bxf) / (100.0 - 48.4 * k - 0.582 * bxf);
    return 48.4 * c / (100 - 0.582 * c);
}

// The Gossett correlation is for abw and not fg. For abv calculation Gossett utilizes the
// Bonham correlation. Here the fg is derived from the abw equation instead.
function corGossett(bxi, bxf, wcf) {
    abw = abwGosett(bxi, bxf, wcf);
    ae = bxi - (abw * (2.0665 - 1.0665 * bxi / 100.0)) / 0.8052;
    return [bxi, ae, pToSG(ae)];
}

// Novotný correlation functions implemented according to:
// Petr Novotný. Počítáme: Nová korekce refraktometru. 2017.
// URL: http://www.diversity.beer/2017/01/pocitame-nova-korekce-refraktometru.html

function corNovotnyLinear(bxi, bxf, wcf) {
    oe = correctBx(bxi, wcf);
    bxfc = correctBx(bxf, wcf);
    fg = -0.002349 * oe + 0.006276 * bxfc + 1.0;
    return [oe, sgToP(fg), fg];
}

function corNovotnyQuadratic(bxi, bxf, wcf) {
    oe = correctBx(bxi, wcf);
    bxfc = correctBx(bxf, wcf);
    fg = 1.335 * 10.0**-5 * oe**2 -
        3.239 * 10.0**-5 * oe * bxfc +
        2.916 * 10.0**-5 * bxfc**2 -
        2.421 * 10.0**-3 * oe +
        6.219 * 10.0**-3 * bxfc + 1.0;
    return [oe, sgToP(fg), fg];
}

// Terrill correlation functions implemented according to:
// Sean Terrill. Refractometer FG Results. 2011.
// URL: http://seanterrill.com/2011/04/07/refractometer-fg-results/

function corTerrillLinear(bxi, bxf, wcf) {
    oe = correctBx(bxi, wcf);
    bxfc = correctBx(bxf, wcf);
    fg = 1.0 - 0.000856829 * oe + 0.00349412 * bxfc;
    return [oe, sgToP(fg), fg];
}

function corTerrillCubic(bxi, bxf, wcf) {
    oe = correctBx(bxi, wcf);
    bxfc = correctBx(bxf, wcf);
    fg = 1.0 - 0.0044993 * oe + 0.000275806 * oe**2 -
        0.00000727999 * oe**3 + 0.0117741 * bxfc -
        0.00127169 * bxfc**2 + 0.0000632929 * bxfc**3;
    return [oe, sgToP(fg), fg];
}

// Sean Terrill's website issues. 2020.
// URL: https://www.reddit.com/r/Homebrewing/comments/bs3af9/sean_terrills_website_issues

function corNovotrill(bxi, bxf, wcf) {
    const [oe1, ae1, fg1] = corTerrillLinear(bxi, bxf, wcf);
    const [oe2, ae2, fg2] = corNovotnyLinear(bxi, bxf, wcf);
    fg_mean = (fg1 + fg2) / 2.0;
    fg = fg1;
    if (fg_mean < 1.014)
        fg = fg1;
    else
        fg = fg2;
    return [oe1, sgToP(fg), fg];
}

// Nutrient content calculation implemented according to:
// MEBAK. Wort, Beer and Beer-based Beverages. Freising-Weihenstephan: Fritz Jacob, 2013,
// S. 161. ISBN: 978-3-9805814-7-9.

function calcKJPer100ML(fg, re, abw) {
    return fg * (14 * re + 29 * abw);
}

function calcKcalPer100ML(fg, re, abw) {
    return fg * (3.5 * re + 7 * abw);
}

calibrationData = [
]; 

selectedMeasurement = -1;

function initCalibration() {
    calibration = new Calibration(calibrationData);
}

function createTuple(target, actual) {
    return { x: actual, y: target };
}

textPoint = "Punkt";
textNominalValue = "Sollwert";
textActualValue = "Istwert";

class Calibration {
    constructor(data) {
        let dataWithZero = [...data];
        dataWithZero.push(createTuple(0.0, 0.0));
        if (dataWithZero.length > 1) {
            let degree = dataWithZero.length - 1;
            if (degree > 3)
                degree = 3;
            this.model = PolynomialRegression.read(dataWithZero, degree);
            this.terms = this.model.getTerms();
        } else {
            this.model = null;
            this.terms = null;
        }
    }

    getType() {
        if (this.model == null) {
            return "1-" + textPoint;
        } else if (this.model.degree == 1) {
            return "2-" + textPoint;
        } else {
            return "N-" + textPoint;
        }
    }

    transform(value) {
        let newValue = value;
        if (this.model != null) {
            newValue = this.model.predictY(this.terms, newValue);
        }
        return newValue;
    }
}

initCalibration();

class RefracModel {
    constructor(corModel, abwModel = null) {
        this.corModel = corModel;  
        this.abwModel = abwModel;
    }

    calc(bxi_, bxf_, wcf) {
        let bxi = calibration.transform(bxi_);
        let bxf = calibration.transform(bxf_);
        const [oe, ae, fg] = this.corModel(bxi, bxf, wcf);
        let result = new Result();
        result.oe = oe;
        result.ae = ae;
        result.fg = fg;
        result.re = calcRE(oe, ae);
        if (this.abwModel == null) {
            result.abw = calcABW(oe, result.re);
        } else {
            result.abw = this.abwModel(bxi, bxf, wcf);
        }
        result.abv = calcABV(result.abw, fg);
        result.adf = calcADF(oe, ae);
        result.rdf = calcRDF(oe, result.re);
        result.kcal = calcKcalPer100ML(fg, result.re, result.abw);
        result.kj = calcKJPer100ML(fg, result.re, result.abw);
        return result;
    }
}

refracModels = [
    new RefracModel(corTerrillLinear),
    new RefracModel(corTerrillCubic),
    new RefracModel(corNovotnyLinear),
    new RefracModel(corNovotnyQuadratic),
    new RefracModel(corNovotrill),
    new RefracModel(corBonham),
    new RefracModel(corGardner),
    new RefracModel(corGossett, abwGosett)
];

class Result {
    constructor() {
        this.oe = NaN;
        this.ae = NaN;
        this.fg = NaN;
        this.re = NaN;
        this.abv = NaN;
        this.abw = NaN;
        this.adf = NaN;
        this.rdf = NaN;
        this.kcal = NaN;
        this.kj = NaN;
    }
}

function isNumeric(str) {
    if (typeof str != 'string')
        return false;  
    return !isNaN(str) && !isNaN(parseFloat(str))
}

function isValidInput(value) {
    return isNumeric(value) && parseFloat(value) > 0.0;
}

class Input {
    constructor() {
        this.modelIndex = 0;
        this.bxi = '';
        this.bxf = '';
        this.wcf = '';
    }

    hasBXI() {
        return isValidInput(this.bxi);
    }

    getBXI() {
        return parseFloat(this.bxi);
    }

    hasBXF() {
        return isValidInput(this.bxf);
    }

    getBXF() {
        return parseFloat(this.bxf);
    }

    hasWCF() {
        return isValidInput(this.wcf);
    }

    getWCF() {
        return parseFloat(this.wcf);
    }
}

function calc(input) {
    var result = new Result();
    if (input.hasBXI() && input.hasWCF()) {
        model = refracModels[input.modelIndex];
        result.oe = correctBx(calibration.transform(input.getBXI()), input.getWCF());
        if (input.hasBXF() && input.getBXI() > input.getBXF()) {
            result = model.calc(input.getBXI(), input.getBXF(), input.getWCF());
        }
    };
    return result;
}

function textify(value, unit, digits = 2) {
    if (isNaN(value)) {
        return "-";
    } else {
        text = value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
        if (unit.length > 0)
            text = text  + " " + unit;
        return text;
    }
}

function concat(text1, text2) {
    return text1 + "; " + text2;
}

function textify2(value1, unit1, value2, unit2) {
    return concat(textify(value1, unit1), textify(value2, unit2));
}

function textifyExtract(value, unit, valueSG = NaN) {
    if (isNaN(valueSG))
        valueSG = pToSG(value);
    return concat(textify(value, unit), textify(valueSG, "SG", 3));
}

function updateTable(result) {
    $('#abvoutput').html(textify2(result.abv, "%v/v", result.abw, "%w/w"));            
    $('#oeoutput').html(textifyExtract(result.oe, "°P"));
    $('#aeoutput').html(textifyExtract(result.ae, "%w/w", result.fg));
    $('#adfoutput').html(textify(result.adf, "%"));            
    $('#reoutput').html(textifyExtract(result.re, "%w/w"));
    $('#rdfoutput').html(textify(result.rdf, "%"));
    $('#caloutput').html(textify2(result.kj, "kJ", result.kcal, "kcal"));
    $('#caliboutput').html(calibration.getType());
}

function getInput() {
    var input = new Input();
    input.modelIndex = $('#formselect').prop('selectedIndex');
    input.bxi = $('#bxiinput').val();
    input.bxf = $('#bxfinput').val();
    input.wcf = $('#wcfinput').val();
    return input;
}

function setInput(input) {
    $('#formselect').prop('selectedIndex', input.modelIndex).change();
    $('#bxiinput').val(input.bxi);
    $('#bxfinput').val(input.bxf);
    $('#wcfinput').val(input.wcf);
}

const STORAGE_NAME_INPUT = 'lastInput';
const STORAGE_NAME_CALIB = 'calibrationData';

function storeInput() {
    var input = getInput();
    localStorage.setItem(STORAGE_NAME_INPUT, JSON.stringify(input));
}

function restoreInput() {
    try {
        var item = localStorage.getItem(STORAGE_NAME_INPUT);
        if (!(item === null)) {
            var input = JSON.parse(item);
            setInput(input);
            updateResult();
        }
    } catch (err) {
    }
}

function storeCalibration() {
    localStorage.setItem(STORAGE_NAME_CALIB, JSON.stringify(calibrationData));
}

function restoreCalibration() {
    try {
        var item = localStorage.getItem(STORAGE_NAME_CALIB);
        if (!(item === null)) {
            calibrationData = JSON.parse(item);
        }
    } catch (err) {
        calibrationData = []
    }
    initCalibration();
}

function updateResult() {
    if (!pageCalculationInitialized)
        return;
    
    var input = getInput();
    var result = calc(input);
    updateTable(result);
}

function initList() {
    if (!pageCalibrationInitialized)
        return;

    $('#lvcalibration').empty();
    refreshListView('#lvcalibration');
    addItemsToList('#lvcalibration', calibrationData, function(i, entity) {
    	text = concat(textNominalValue + ': ' + textify(entity.y, '°Bx'), textActualValue + ': ' + textify(entity.x, '°Bx'));
        return '<li id="' + i + '"><a href="#pdetails">' + text + '</a></li>';
    });
}

function refreshListView(listviewId) {
    $(listviewId).listview('refresh');
}

function addItemsToList(listviewId, items, itemRenderer) {
    $.each(items, function(i, item) {
    	itemCode = itemRenderer(i, item);
    	$(listviewId).append(itemCode);
    });
    refreshListView(listviewId);
}

function showButton(buttonId, shouldShow) {
    var button = $(buttonId);
    if (shouldShow)
        button.show();
    else
        button.hide();
}

pageCalculationInitialized = false;
pageCalibrationInitialized = false;

$(document).on('pageinit', '#pcalculation', function(event) {
    pageCalculationInitialized = true;
    $('#btncalc').click(function() {
        updateResult();
        storeInput();
    });
    updateTable(new Result());
    restoreInput();
});

$(document).on('pageinit', '#pcalibration', function(event) {
    pageCalibrationInitialized = true;
    initList();
    $('#lvcalibration').delegate('li', 'click', function() {
		selectedMeasurement = $(this).attr('id');
        entry = calibrationData[selectedMeasurement];
        $('#targetinput').val(entry.y);
        $('#actualinput').val(entry.x);
        showButton('#btndelete', true);
	});
	$('#btnadd').click(function() {
        selectedMeasurement = -1;
        $('#targetinput').val('');
        $('#actualinput').val('');
        showButton('#btndelete', false);
	});
    $('#btnimport').click(function() {
        input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = e => { 
            file = e.target.files[0]; 
            var reader = new FileReader();
            reader.readAsText(file,'UTF-8');
            reader.onload = readerEvent => {
               var content = readerEvent.target.result;
                try {
                    importedCalibrationData = JSON.parse(content);
                    calibrationData = importedCalibrationData;
                    updateAfterCalibrationDataChange();
                } catch (err) {
                }
               
            } 
         }        
        input.click();
	});
    $('#btnexport').click(function() {
        blob = new Blob([JSON.stringify(calibrationData)], {type: 'application/json'});
        downloadLink = document.createElement('a');
        downloadLink.download = "calibration.json"
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
	});    
});

function updateAfterCalibrationDataChange() {
    selectedMeasurement = -1;
    storeCalibration();
    initCalibration();
    initList();
    updateResult();
}

$(document).on('pageinit', '#pdetails', function(event) {
    showButton('#btndelete', selectedMeasurement > 0);
    $('#btnsave').click(function() {
        if (isValidInput($('#targetinput').val()) && isValidInput($('#actualinput').val())) {
            target = parseFloat($('#targetinput').val())
            actual = parseFloat($('#actualinput').val())
            entry = createTuple(target, actual);
            if (selectedMeasurement >= 0)
                calibrationData[selectedMeasurement] = entry
            else
                calibrationData.push(entry);
        }
        updateAfterCalibrationDataChange();
    });
    $('#btndelete').click(function() {
        calibrationData.splice(selectedMeasurement, 1);
        updateAfterCalibrationDataChange();
    });
});

restoreCalibration();