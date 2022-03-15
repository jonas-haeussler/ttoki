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
var types_1 = require("../shared/types");
var node_fetch_1 = require("node-fetch");
var node_html_parser_1 = require("node-html-parser");
var utils_1 = require("./utils");
var luxon_1 = require("luxon");
var uuid_1 = require("uuid");
var fs_1 = require("fs");
/**
 * Parse html tables to get a javascript representation
 * @param {Response} html The html snippet to parse the tables from
 * @return {Array<Array<string>>} The table in an array representation
 */
function getTablesFromHTML(html) {
    function parseTable(rows) {
        var rowData = [];
        for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
            var row = rows_1[_i];
            if (row.classList.contains('divider-muted')) {
                break;
            }
            if (!row.classList.contains('collapse')) {
                var entries = row.getElementsByTagName('td')
                    .map(function (el) {
                    // el.childNodes.forEach(node => el.removeChild(node));
                    return el.innerText.replace(/\n/g, '');
                });
                rowData.push(entries);
            }
        }
        console.log(rowData);
        return rowData;
    }
    var root = (0, node_html_parser_1["default"])(html);
    var playingPlanDesktop = root.querySelectorAll('#playingPlanDesktop > tbody > tr');
    var gamestatsTable = root.querySelectorAll('#gamestatsTable > tbody > tr');
    if (playingPlanDesktop && gamestatsTable) {
        return {
            playingPlanDesktop: parseTable(playingPlanDesktop),
            gamestatsTable: parseTable(gamestatsTable)
        };
    }
    else {
        throw Error('Table "playingPlanDesktop" or "gamestatsTable" not found');
    }
}
/**
 * Extract all information about matches from a table representation
 * @param {Array<Array<string>>} table The table to get the matches from
 * @return {{date, Array<Game>}} A TTDates representation of dates parsed from tables
 */
function getGamesForTeam(table) {
    var arr = [];
    for (var _i = 0, table_1 = table; _i < table_1.length; _i++) {
        var entry = table_1[_i];
        if (entry.length > 0) {
            var date = entry[0];
            var time = entry[1].split(' ')[0];
            var venue = entry[3].includes('Oberkirchberg') ?
                types_1.Venue.Home : types_1.Venue.Abroad;
            var enemy = venue === types_1.Venue.Home ? entry[4] : entry[3];
            var game = {
                time: time,
                enemy: enemy,
                venue: venue
            };
            arr.push({ date: date.split(' ')[1], game: game });
        }
    }
    return arr;
}
function getPlayersForTeam(table) {
    var arr = [];
    for (var _i = 0, table_2 = table; _i < table_2.length; _i++) {
        var entry = table_2[_i];
        if (entry.length > 0) {
            var name_1 = entry[1];
            arr.push(name_1);
        }
    }
    return arr;
}
/**
 * Login for mytischtennis
 * @return {RequestInit} options for a get Request with the login cookie
 */
function login() {
    return __awaiter(this, void 0, void 0, function () {
        var formData, options, login, cookies, opt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new URLSearchParams();
                    formData.append('userNameB', '--Johnny--');
                    formData.append('userPassWordB', 'fraudech1');
                    formData.append('targetPage', 'https://www.mytischtennis.de/community/index?fromlogin=1');
                    formData.append('goLogin', 'Einloggen');
                    options = {
                        method: 'POST',
                        redirect: 'manual',
                        body: formData
                    };
                    return [4 /*yield*/, (0, node_fetch_1["default"])('https://www.mytischtennis.de/community/login', options)];
                case 1:
                    login = _a.sent();
                    cookies = login.headers.get('Set-Cookie');
                    if (cookies == null) {
                        throw Error('Did not get a valid login cookie');
                    }
                    else {
                        opt = {
                            method: 'GET',
                            headers: {
                                'Cookie': cookies
                            },
                            redirect: 'manual'
                        };
                        return [2 /*return*/, opt];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function getDateRange(dateIndex) {
    return "R[1-3]C[".concat(3 + dateIndex, "]");
}
/**
 * Load the table tennis matches from mytischtennis
 */
function loadMatches() {
    return __awaiter(this, void 0, void 0, function () {
        var opt, raw, config, team1, team2, tablesFirstTeam, _a, tablesSecondTeam, _b, gamesFirstTeam, gamesSecondTeam, playersFirstTeam, playersSecondTeam, gameFirstTeam, gameSecondTeam, entries, firstDate, secondDate, entry;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, login()];
                case 1:
                    opt = _c.sent();
                    raw = (0, fs_1.readFileSync)('./teamConfig.json').toString();
                    config = JSON.parse(raw);
                    return [4 /*yield*/, (0, node_fetch_1["default"])('https://www.mytischtennis.de/clicktt/TTBW/' +
                            config['saison'] +
                            '/ligen/' +
                            config['teams'][0]['league'] +
                            '/gruppe/' +
                            config['teams'][0]['groupId'] +
                            '/mannschaft/' +
                            config['teams'][0]['teamId'] +
                            '/TSG-Oberkirchberg/spielerbilanzen/' +
                            config['round'] +
                            '/', opt)];
                case 2:
                    team1 = _c.sent();
                    return [4 /*yield*/, (0, node_fetch_1["default"])('https://www.mytischtennis.de/clicktt/TTBW/' +
                            config['saison'] +
                            '/ligen/' +
                            config['teams'][1]['league'] +
                            '/gruppe/' +
                            config['teams'][1]['groupId'] +
                            '/mannschaft/' +
                            config['teams'][1]['teamId'] +
                            '/Herren%20II/spielerbilanzen/' +
                            config['round'] +
                            '/', opt)];
                case 3:
                    team2 = _c.sent();
                    _a = getTablesFromHTML;
                    return [4 /*yield*/, team1.text()];
                case 4:
                    tablesFirstTeam = _a.apply(void 0, [_c.sent()]);
                    _b = getTablesFromHTML;
                    return [4 /*yield*/, team2.text()];
                case 5:
                    tablesSecondTeam = _b.apply(void 0, [_c.sent()]);
                    gamesFirstTeam = getGamesForTeam(tablesFirstTeam.playingPlanDesktop)[Symbol.iterator]();
                    gamesSecondTeam = getGamesForTeam(tablesSecondTeam.playingPlanDesktop)[Symbol.iterator]();
                    playersFirstTeam = getPlayersForTeam(tablesFirstTeam.gamestatsTable);
                    playersSecondTeam = getPlayersForTeam(tablesSecondTeam.gamestatsTable);
                    gameFirstTeam = gamesFirstTeam.next();
                    gameSecondTeam = gamesSecondTeam.next();
                    entries = [];
                    while (true) {
                        if (gameFirstTeam.done && gameSecondTeam.done)
                            break;
                        firstDate = luxon_1.DateTime.now();
                        secondDate = luxon_1.DateTime.now();
                        if (gameFirstTeam.value)
                            firstDate = luxon_1.DateTime.fromFormat(gameFirstTeam.value.date, 'dd.MM.yy');
                        if (gameSecondTeam.value)
                            secondDate = luxon_1.DateTime.fromFormat(gameSecondTeam.value.date, 'dd.MM.yy');
                        entry = {
                            id: (0, uuid_1.v4)(),
                            activePlayers: [],
                            availablePlayers: []
                        };
                        if (firstDate.startOf('day') <= secondDate.startOf('day')) {
                            entry.date = firstDate.toFormat('dd.MM.yy');
                            entry.firstTeam = gameFirstTeam.value.game;
                            gameFirstTeam = gamesFirstTeam.next();
                        }
                        if (firstDate.startOf('day') >= secondDate.startOf('day')) {
                            entry.date = secondDate.toFormat('dd.MM.yy');
                            entry.secondTeam = gameSecondTeam.value.game;
                            gameSecondTeam = gamesSecondTeam.next();
                        }
                        entries.push(entry);
                    }
                    return [2 /*return*/, { ttDates: entries, allPlayers: playersFirstTeam.concat(playersSecondTeam) }];
            }
        });
    });
}
function initTable() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function () {
        var ttDates, spreadSheetId, dateValues, firstTeamEnemies, firstTeamTimes, firstTeamVenues, secondTeamEnemies, secondTeamTimes, secondTeamVenues, _i, _k, ttDate, venue, i, currentPlayer;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0: return [4 /*yield*/, loadMatches()];
                case 1:
                    ttDates = _l.sent();
                    return [4 /*yield*/, (0, utils_1.createNewSpreadsheet)()];
                case 2:
                    spreadSheetId = _l.sent();
                    if (spreadSheetId) {
                        (0, utils_1.addNewGoogleConfig)({
                            spreadSheetId: spreadSheetId,
                            ranges: {
                                players: "Sheet1!B9:B",
                                dates: "Sheet1!C1:1",
                                gamesFirstTeam: "Sheet1!C2:Z4",
                                gamesSecondTeam: "Sheet1!C5:Z7",
                                entries: "Sheet1!C9:ZZZ"
                            }
                        });
                        dateValues = [];
                        firstTeamEnemies = [];
                        firstTeamTimes = [];
                        firstTeamVenues = [];
                        secondTeamEnemies = [];
                        secondTeamTimes = [];
                        secondTeamVenues = [];
                        console.log(ttDates.ttDates);
                        for (_i = 0, _k = ttDates.ttDates; _i < _k.length; _i++) {
                            ttDate = _k[_i];
                            dateValues.push(ttDate.date);
                            firstTeamEnemies.push(((_a = ttDate.firstTeam) === null || _a === void 0 ? void 0 : _a.enemy) ? ttDate.firstTeam.enemy : '');
                            firstTeamTimes.push(((_b = ttDate.firstTeam) === null || _b === void 0 ? void 0 : _b.time) ? ttDate.firstTeam.time : '');
                            venue = (((_c = ttDate.firstTeam) === null || _c === void 0 ? void 0 : _c.venue) === types_1.Venue.Home ? 'Heim' : 'Auswärts');
                            firstTeamVenues.push(((_d = ttDate.firstTeam) === null || _d === void 0 ? void 0 : _d.venue) !== undefined ? venue : '');
                            secondTeamEnemies.push(((_e = ttDate.secondTeam) === null || _e === void 0 ? void 0 : _e.enemy) ? ttDate.secondTeam.enemy : '');
                            secondTeamTimes.push(((_f = ttDate.secondTeam) === null || _f === void 0 ? void 0 : _f.time) ? ttDate.secondTeam.time : '');
                            venue = ((_g = ttDate.secondTeam) === null || _g === void 0 ? void 0 : _g.venue) === types_1.Venue.Home ? 'Heim' : 'Auswärts';
                            console.log(venue + ' ' + ((_h = ttDate.secondTeam) === null || _h === void 0 ? void 0 : _h.venue));
                            secondTeamVenues.push(((_j = ttDate.secondTeam) === null || _j === void 0 ? void 0 : _j.venue) !== undefined ? venue : '');
                        }
                        console.log(ttDates.allPlayers);
                        for (i = 0; i < ttDates.allPlayers.length; i++) {
                            currentPlayer = ttDates.allPlayers[i];
                            if (ttDates.allPlayers.slice(i + 1).includes(currentPlayer)) {
                                ttDates.allPlayers.splice(i, 1);
                                i--;
                            }
                        }
                        (0, utils_1.postTable)([dateValues], [firstTeamEnemies, firstTeamTimes, firstTeamVenues], [secondTeamEnemies, secondTeamTimes, secondTeamVenues], ttDates.allPlayers.map(function (player) {
                            var result = player.split(', ');
                            return [result[1] + ' ' + result[0]];
                        }));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
initTable();
