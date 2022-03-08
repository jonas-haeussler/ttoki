"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
/* eslint-disable camelcase */
var luxon_1 = require("luxon");
var express = require("express");
var bodyParser = require("body-parser");
// eslint-disable-next-line camelcase
var googleapis_1 = require("googleapis");
var types_1 = require("../shared/types");
var uuid_1 = require("uuid");
var loadMatches_1 = require("./loadMatches");
var PORT = process.env.PORT || 3001;
// @ts-ignore
var app = express();
var SPREADSHEET_ID = '1z5bmcFTl3qiLwJBybcH-nuDdpw7UluJw-c3fhMqVeWY';
var PLAYER_RANGE = 'Hauptseite!B9:B';
var DATES_RANGE = 'Hauptseite!C1:1';
var FIRST_TEAM_DATA_RANGE = 'Hauptseite!C2:Z4';
var SECOND_TEAM_DATA_RANGE = 'Hauptseite!C5:Z7';
var ALL_ENTRIES_RANGE = 'Hauptseite!C9:ZZZ';
/**
 * Accomplishes the auth process and gets the needed google spreadsheets
 * @return {Promise<sheets_v4.Sheets>} The google spreadsheets
 */
function getGoogleSheets() {
    return __awaiter(this, void 0, void 0, function () {
        var auth, client, sheets;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = new googleapis_1.google.auth.GoogleAuth({
                        keyFile: './server/lithe-paratext-282507-55e107b033a1.json',
                        scopes: ['https://www.googleapis.com/auth/spreadsheets']
                    });
                    return [4 /*yield*/, auth.getClient()];
                case 1:
                    client = _a.sent();
                    sheets = googleapis_1.google.sheets({ version: 'v4', auth: client });
                    return [2 /*return*/, sheets];
            }
        });
    });
}
/**
 *
 * @param playerIndex
 * @param dateIndex
 * @return
 */
function getPlayerRange(playerIndex, dateIndex) {
    if (dateIndex) {
        return "R[".concat(8 + playerIndex, "]C[").concat(3 + dateIndex, "]");
    }
    return "R[".concat(8 + playerIndex, "]");
}
/**
 *
 * @param sheets
 * @param ranges
 * @returns
 */
function getRangeData(sheets, ranges) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sheets.spreadsheets.values.batchGet({
                        spreadsheetId: SPREADSHEET_ID,
                        ranges: ranges
                    })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data.valueRanges];
            }
        });
    });
}
/**
 * Gets the players currently available in the Google spreadsheet
 * @return {Promise<strin | undefined>} The currently available players
 */
function getPlayers() {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, data, players, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getGoogleSheets()];
                case 1:
                    sheets = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: PLAYER_RANGE
                        })];
                case 3:
                    data = (_a.sent()).data;
                    if (data.values !== undefined && data.values !== null) {
                        players = data.values.map(function (p) { return p[0]; });
                        return [2 /*return*/, players];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    console.error(err_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/, undefined];
            }
        });
    });
}
/**
 * Get a TTDates object from Google Spreadsheets for the given active players
 * @param {Array<string>} activePlayers The active players in the React App
 * @return {Promise<TTDate |undefined>} The result of the query
 */
function getDates(activePlayers) {
    return __awaiter(this, void 0, void 0, function () {
        /**
         * A helper function to get a Date string from day and time strings
         * @param {string} day The day of the date
         * @param {string} time The time of the date at the given day
         * @return {string} An ISO representation of the date
         */
        function parseDate(day, time) {
            var date = luxon_1.DateTime.fromFormat(day, 'dd.MM.yy');
            if (time) {
                var parsed = luxon_1.DateTime.fromISO(time);
                var today = luxon_1.DateTime.now().startOf('day');
                var timeOfDay = parsed.diff(today);
                var result = date.startOf('day').plus(timeOfDay);
                return result.toISO();
            }
            return date.toISO();
        }
        /**
         *
         * @param matches
         * @param dateIndex
         * @param dates
         * @returns
         */
        function getGame(matches, dateIndex, dates) {
            if (matches.every(function (elem) { return elem[dateIndex] !== undefined &&
                elem[dateIndex] !== ''; })) {
                var date = parseDate(dates[dateIndex], matches[2][dateIndex]);
                return {
                    time: date,
                    enemy: matches[0][dateIndex],
                    venue: matches[1][dateIndex] === 'Heim' ? types_1.Venue.Home : types_1.Venue.Abroad
                };
            }
            return null;
        }
        var sheets, ranges, data, dates, matchesFirstTeam, matchesSecondTeam, allPlayers_1, entries_1, ttDates, _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getGoogleSheets()];
                case 1:
                    sheets = _a.sent();
                    ranges = [
                        DATES_RANGE,
                        FIRST_TEAM_DATA_RANGE,
                        SECOND_TEAM_DATA_RANGE,
                        PLAYER_RANGE,
                        ALL_ENTRIES_RANGE,
                    ];
                    return [4 /*yield*/, getRangeData(sheets, ranges)];
                case 2:
                    data = _a.sent();
                    if (data !== undefined) {
                        dates = [];
                        matchesFirstTeam = [];
                        matchesSecondTeam = [];
                        allPlayers_1 = [];
                        entries_1 = [];
                        if (data[0].values !== undefined && data[0].values !== null) {
                            dates = data[0].values[0];
                        }
                        if (data[1].values !== undefined && data[1].values !== null) {
                            matchesFirstTeam = data[1].values;
                        }
                        if (data[2].values !== undefined && data[2].values !== null) {
                            matchesSecondTeam = data[2].values;
                        }
                        if (data[3].values !== undefined && data[3].values !== null) {
                            allPlayers_1 = data[3].values.map(function (p) { return p[0]; });
                        }
                        if (data[4].values !== undefined && data[4].values !== null) {
                            entries_1 = data[4].values;
                        }
                        ttDates = [];
                        _loop_1 = function (i) {
                            var firstTeam = getGame(matchesFirstTeam, i, dates);
                            var secondTeam = getGame(matchesSecondTeam, i, dates);
                            var option = types_1.Option.Dunno;
                            if (activePlayers && activePlayers.length > 0) {
                                option = entries_1[allPlayers_1.indexOf(activePlayers[0])][i].toLowerCase();
                                if (activePlayers.length > 1) {
                                    option = activePlayers.map(function (activePlayer) {
                                        var entry = entries_1[allPlayers_1.indexOf(activePlayer)][i];
                                        entry = entry.toLowerCase();
                                        return entry;
                                    }).reduce(function (prev, curr) {
                                        return prev === curr ? curr : types_1.Option.Dunno;
                                    });
                                }
                            }
                            if (!(Object.values(types_1.Option).some(function (v) { return v === option; }))) {
                                option = types_1.Option.Dunno;
                            }
                            var availablePlayers = [];
                            for (var j = 0; j < allPlayers_1.length; j++) {
                                if (entries_1[j][i] === types_1.Option.Yes) {
                                    availablePlayers.push(allPlayers_1[j]);
                                }
                            }
                            var ttDate = {
                                id: (0, uuid_1.v4)(),
                                date: parseDate(dates[i]),
                                activePlayers: activePlayers,
                                availablePlayers: availablePlayers,
                                option: option
                            };
                            if (firstTeam) {
                                ttDate.firstTeam = firstTeam;
                            }
                            if (secondTeam) {
                                ttDate.secondTeam = secondTeam;
                            }
                            ttDates.push(ttDate);
                        };
                        for (i = 0; i < dates.length; i++) {
                            _loop_1(i);
                        }
                        return [2 /*return*/, { ttDates: ttDates, allPlayers: allPlayers_1 }];
                    }
                    return [2 /*return*/, undefined];
            }
        });
    });
}
/**
 *
 * @param ttDate
 * @returns
 */
function postPlayer(ttDate) {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, values_1, dates_1, players_1, playerRanges, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getGoogleSheets()];
                case 1:
                    sheets = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 7]);
                    values_1 = [[ttDate.option]];
                    return [4 /*yield*/, getDates(ttDate.activePlayers)];
                case 3:
                    dates_1 = _a.sent();
                    players_1 = [];
                    if (dates_1) {
                        players_1 = dates_1.allPlayers;
                    }
                    if (!(dates_1 && players_1)) return [3 /*break*/, 5];
                    playerRanges = ttDate.activePlayers.map(function (player) {
                        return getPlayerRange(players_1 === null || players_1 === void 0 ? void 0 : players_1.indexOf(player), dates_1 === null || dates_1 === void 0 ? void 0 : dates_1.ttDates.indexOf(ttDate));
                    });
                    return [4 /*yield*/, sheets.spreadsheets.values.batchUpdate({
                            spreadsheetId: SPREADSHEET_ID,
                            requestBody: {
                                data: playerRanges.map(function (range) { return ({ range: range, values: values_1 }); }),
                                valueInputOption: 'RAW'
                            }
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_2 = _a.sent();
                    console.error(err_2);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, 'Success'];
            }
        });
    });
}
(0, loadMatches_1.loadMatches)();
app.listen(PORT, function () {
    console.log("Server listening on ".concat(PORT));
});
app.get('/players', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var players;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getPlayers()];
            case 1:
                players = _a.sent();
                res.json(players);
                return [2 /*return*/];
        }
    });
}); });
app.get('/dates', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var filters, activePlayers, dates;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                filters = req.query.filters;
                if (!filters) return [3 /*break*/, 2];
                activePlayers = JSON.parse(filters.toString());
                return [4 /*yield*/, getDates(activePlayers)];
            case 1:
                dates = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.ttDates;
                res.json(dates);
                console.log(dates);
                _b.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
app.post('/player', bodyParser.json(), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var date, answer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                date = req.body;
                console.log(date);
                return [4 /*yield*/, postPlayer(date)];
            case 1:
                answer = _a.sent();
                console.log(answer);
                return [2 /*return*/];
        }
    });
}); });
