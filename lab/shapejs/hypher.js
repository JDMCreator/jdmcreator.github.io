/**
 * @constructor
 * @param {!{patterns: !Object, leftmin: !number, rightmin: !number}} language The language pattern file. Compatible with Hyphenator.js.
 */
function Hypher(language) {
    var exceptions = [],
        i = 0;
    /**
     * @type {!Hypher.TrieNode}
     */
    this.trie = this.createTrie(language['patterns']);

    /**
     * @type {!number}
     * @const
     */
    this.leftMin = language['leftmin'];

    /**
     * @type {!number}
     * @const
     */
    this.rightMin = language['rightmin'];

    /**
     * @type {!Object.<string, !Array.<string>>}
     */
    this.exceptions = {};

    if (language['exceptions']) {
        exceptions = language['exceptions'].split(/,\s?/g);

        for (; i < exceptions.length; i += 1) {
            this.exceptions[exceptions[i].replace(/\u2027/g, '').toLowerCase()] = new RegExp('(' + exceptions[i].split('\u2027').join(')(') + ')', 'i');
        }
    }
}

/**
 * @typedef {{_points: !Array.<number>}}
 */
Hypher.TrieNode;

/**
 * Creates a trie from a language pattern.
 * @private
 * @param {!Object} patternObject An object with language patterns.
 * @return {!Hypher.TrieNode} An object trie.
 */
Hypher.prototype.createTrie = function (patternObject) {
    var size = 0,
        i = 0,
        c = 0,
        p = 0,
        chars = null,
        points = null,
        codePoint = null,
        t = null,
        tree = {
            _points: []
        },
        patterns;

    for (size in patternObject) {
        if (patternObject.hasOwnProperty(size)) {
            patterns = patternObject[size].match(new RegExp('.{1,' + (+size) + '}', 'g'));

            for (i = 0; i < patterns.length; i += 1) {
                chars = patterns[i].replace(/[0-9]/g, '').split('');
                points = patterns[i].split(/\D/);
                t = tree;

                for (c = 0; c < chars.length; c += 1) {
                    codePoint = chars[c].charCodeAt(0);

                    if (!t[codePoint]) {
                        t[codePoint] = {};
                    }
                    t = t[codePoint];
                }

                t._points = [];

                for (p = 0; p < points.length; p += 1) {
                    t._points[p] = points[p] || 0;
                }
            }
        }
    }
    return tree;
};

/**
 * Hyphenates a text.
 *
 * @param {!string} str The text to hyphenate.
 * @return {!string} The same text with soft hyphens inserted in the right positions.
 */
Hypher.prototype.hyphenateText = function (str, minLength) {
    minLength = minLength || 4;

    // Regexp("\b", "g") splits on word boundaries,
    // compound separators and ZWNJ so we don't need
    // any special cases for those characters. Unfortunately
    // it does not support unicode word boundaries, so
    // we implement it manually.
    var words = str.split(/([a-zA-Z0-9_\u0027\u00DF-\u00EA\u00EB\u00EC-\u00EF\u00F1-\u00F6\u00F8-\u00FD\u0101\u0103\u0105\u0107\u0109\u010D\u010F\u0111\u0113\u0117\u0119\u011B\u011D\u011F\u0123\u0125\u012B\u012F\u0131\u0135\u0137\u013C\u013E\u0142\u0144\u0146\u0148\u0151\u0153\u0155\u0159\u015B\u015D\u015F\u0161\u0165\u016B\u016D\u016F\u0171\u0173\u017A\u017C\u017E\u017F\u0219\u021B\u02BC\u0390\u03AC-\u03CE\u03F2\u0401\u0410-\u044F\u0451\u0454\u0456\u0457\u045E\u0491\u0531-\u0556\u0561-\u0587\u0902\u0903\u0905-\u090B\u090E-\u0910\u0912\u0914-\u0928\u092A-\u0939\u093E-\u0943\u0946-\u0948\u094A-\u094D\u0982\u0983\u0985-\u098B\u098F\u0990\u0994-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BE-\u09C3\u09C7\u09C8\u09CB-\u09CD\u09D7\u0A02\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A14-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A82\u0A83\u0A85-\u0A8B\u0A8F\u0A90\u0A94-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABE-\u0AC3\u0AC7\u0AC8\u0ACB-\u0ACD\u0B02\u0B03\u0B05-\u0B0B\u0B0F\u0B10\u0B14-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3E-\u0B43\u0B47\u0B48\u0B4B-\u0B4D\u0B57\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C02\u0C03\u0C05-\u0C0B\u0C0E-\u0C10\u0C12\u0C14-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3E-\u0C43\u0C46-\u0C48\u0C4A-\u0C4D\u0C82\u0C83\u0C85-\u0C8B\u0C8E-\u0C90\u0C92\u0C94-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBE-\u0CC3\u0CC6-\u0CC8\u0CCA-\u0CCD\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D3E-\u0D43\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D60\u0D61\u0D7A-\u0D7F\u1F00-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB2-\u1FB4\u1FB6\u1FB7\u1FBD\u1FBF\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD2\u1FD3\u1FD6\u1FD7\u1FE2-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u200D\u2019]+)/g);

    for (var i = 0; i < words.length; i += 1) {
        if (words[i].indexOf('/') !== -1) {
            // Don't insert a zero width space if the slash is at the beginning or end
            // of the text, or right after or before a space.
            if (i !== 0 && i !== words.length - 1 && !(/\s+\/|\/\s+/.test(words[i]))) {
                words[i] += '\u200B';
            }
        } else if (words[i].length > minLength) {
            words[i] = this.hyphenate(words[i]).join('\u00AD');
        }
    }
    return words.join('');
};

/**
 * Hyphenates a word.
 *
 * @param {!string} word The word to hyphenate
 * @return {!Array.<!string>} An array of word fragments indicating valid hyphenation points.
 */
Hypher.prototype.hyphenate = function (word) {
    var characters,
        characterPoints = [],
        originalCharacters,
        i,
        j,
        k,
        node,
        points = [],
        wordLength,
        lowerCaseWord = word.toLowerCase(),
        nodePoints,
        nodePointsLength,
        m = Math.max,
        trie = this.trie,
        result = [''];

    if (this.exceptions.hasOwnProperty(lowerCaseWord)) {
        return word.match(this.exceptions[lowerCaseWord]).slice(1);
    }

    if (word.indexOf('\u00AD') !== -1) {
        return [word];
    }

    word = '_' + word + '_';

    characters = word.toLowerCase().split('');
    originalCharacters = word.split('');
    wordLength = characters.length;

    for (i = 0; i < wordLength; i += 1) {
        points[i] = 0;
        characterPoints[i] = characters[i].charCodeAt(0);
    }

    for (i = 0; i < wordLength; i += 1) {
        node = trie;
        for (j = i; j < wordLength; j += 1) {
            node = node[characterPoints[j]];

            if (node) {
                nodePoints = node._points;
                if (nodePoints) {
                    for (k = 0, nodePointsLength = nodePoints.length; k < nodePointsLength; k += 1) {
                        points[i + k] = m(points[i + k], nodePoints[k]);
                    }
                }
            } else {
                break;
            }
        }
    }

    for (i = 1; i < wordLength - 1; i += 1) {
        if (i > this.leftMin && i < (wordLength - this.rightMin) && points[i] % 2) {
            result.push(originalCharacters[i]);
        } else {
            result[result.length - 1] += originalCharacters[i];
        }
    }

    return result;
};

Hypher.latin = {
    leftmin: 2,
    rightmin: 2,
    specialChars: "鏈",
    patterns: {
        2: "�1�11b1c1d1f1g1h1j1k1l1m1n1p1r1t1v1x1z",
        3: "2bb2bdb2l2bm2bnb2r2bt2bs2b_2ccc2l2cm2cn2cqc2r2cs2ct2cz2c_2dd2dg2dmd2r2ds2dv2d_2fff2l2fnf2r2ft2f_2gg2gd2gfg2l2gmg2ng2r2gs2gv2g_2hp2ht2h_2kk2lb2lc2ld2lf2lg2lk2ll2lm2ln2lp2lq2lr2ls2lt2lv2l_2mm2mb2mp2ml2mn2mq2mr2mv2m_2nb2nc2nd2nf2ng2nl2nm2nn2np2nq2nr2ns2nt2nv2nx2n_p2hp2l2pn2ppp2r2ps2pt2pz2p_2rb2rc2rd2rf2rgr2h2rl2rm2rn2rp2rq2rr2rs2rt2rv2rz2r_1s22s_2tb2tc2td2tf2tgt2ht2lt2r2tm2tn2tp2tq2tt2tv2t_v2lv2r2vv2xt2xx2x_2z_",
        4: "a1iaa1iea1ioa1iuae1aae1oae1ue1iuio1io1iao1ieo1ioo1iuuo3uc2h2k2h22php2pht1qu22s3s2stb2stc2std2stf2stg2stm2stn2stp2stq2sts2stt2stv2st_a1uaa1uea1uia1uoa1uue1uae1uee1uie1uoe1uui1uai1uei1uii1uoi1uuo1uao1ueo1uio1uoo1uuu1uau1ueu1uiu1uou1uu",
        5: "_e2x1_o2b3l3f2tn2s3mn2s3f2s3ph2st3l",
        6: "_a2b3l_anti13p2sic3p2neua2l1uaa2l1uea2l1uia2l1uoa2l1uue2l1uae2l1uee2l1uie2l1uoe2l1uui2l1uai2l1uei2l1uii2l1uoi2l1uuo2l1uao2l1ueo2l1uio2l1uoo2l1uuu2l1uau2l1ueu2l1uiu2l1uou2l1uua2m1uaa2m1uea2m1uia2m1uoa2m1uue2m1uae2m1uee2m1uie2m1uoe2m1uui2m1uai2m1uei2m1uii2m1uoi2m1uuo2m1uao2m1ueo2m1uio2m1uoo2m1uuu2m1uau2m1ueu2m1uiu2m1uou2m1uua2n1uaa2n1uea2n1uia2n1uoa2n1uue2n1uae2n1uee2n1uie2n1uoe2n1uui2n1uai2n1uei2n1uii2n1uoi2n1uuo2n1uao2n1ueo2n1uio2n1uoo2n1uuu2n1uau2n1ueu2n1uiu2n1uou2n1uua2r1uaa2r1uea2r1uia2r1uoa2r1uue2r1uae2r1uee2r1uie2r1uoe2r1uui2r1uai2r1uei2r1uii2r1uoi2r1uuo2r1uao2r1ueo2r1uio2r1uoo2r1uuu2r1uau2r1ueu2r1uiu2r1uou2r1uu",
        7: "_para1i_para1u_su2b3r2s3que_2s3dem_",
        8: "_su2b3lu",
        9: "_anti3m2n_circu2m1_co2n1iun",
        10: "_di2s3cine"
    },
    patternChars: "_abcdefghijklmnopqrstuvxz鏈",
    patternArrayLength: 3273,
    valueStoreLength: 1010
};