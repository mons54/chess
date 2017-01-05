var game = {
    options: {
        stop: false,
        blanc: {
            coup: null,
            img: null,
            nom: null,
            decompte: null,
            decompte_tour: null,
            piece_reste: ''
        },
        noir: {
            coup: null,
            img: null,
            nom: null,
            decompte: null,
            decompte_tour: null,
            piece_reste: ''
        }
    },
    newGame: function () {
        this.proposer_nul = 0;
        this.jeu = {
            resultat: {
                vainqueur: "",
                nom: ""
            },
            blanc: {
                roi: {
                    position: 'e1',
                    deplacement_interdit: ""
                },
                pieces: 16
            },
            noir: {
                roi: {
                    position: 'e8',
                    deplacement_interdit: ""
                },
                pieces: 16
            },
            terminer: 0,
            tour: 'blanc',
            position: {
                e1: {
                    nom: 'roi',
                    couleur: 'blanc',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                e8: {
                    nom: 'roi',
                    couleur: 'noir',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                d1: {
                    nom: 'reine',
                    couleur: 'blanc',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                d8: {
                    nom: 'reine',
                    couleur: 'noir',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                c1: {
                    nom: 'fou',
                    couleur: 'blanc',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                f1: {
                    nom: 'fou',
                    couleur: 'blanc',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                c8: {
                    nom: 'fou',
                    couleur: 'noir',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                f8: {
                    nom: 'fou',
                    couleur: 'noir',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                b1: {
                    nom: 'cavalier',
                    couleur: 'blanc',
                    deplacement: 'a3.c3',
                    capture: '',
                    move: 0
                },
                g1: {
                    nom: 'cavalier',
                    couleur: 'blanc',
                    deplacement: 'f3.h3',
                    capture: '',
                    move: 0
                },
                b8: {
                    nom: 'cavalier',
                    couleur: 'noir',
                    deplacement: 'a6.c6',
                    capture: '',
                    move: 0
                },
                g8: {
                    nom: 'cavalier',
                    couleur: 'noir',
                    deplacement: 'f6.h6',
                    capture: '',
                    move: 0
                },
                a1: {
                    nom: 'tour',
                    couleur: 'blanc',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                h1: {
                    nom: 'tour',
                    couleur: 'blanc',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                a8: {
                    nom: 'tour',
                    couleur: 'noir',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                h8: {
                    nom: 'tour',
                    couleur: 'noir',
                    deplacement: '',
                    capture: '',
                    move: 0
                },
                a2: {
                    nom: 'pion',
                    couleur: 'blanc',
                    deplacement: 'a3.a4',
                    capture: '',
                    move: 0
                },
                b2: {
                    nom: 'pion',
                    couleur: 'blanc',
                    deplacement: 'b3.b4',
                    capture: '',
                    move: 0
                },
                c2: {
                    nom: 'pion',
                    couleur: 'blanc',
                    deplacement: 'c3.c4',
                    capture: '',
                    move: 0
                },
                d2: {
                    nom: 'pion',
                    couleur: 'blanc',
                    deplacement: 'd3.d4',
                    capture: '',
                    move: 0
                },
                e2: {
                    nom: 'pion',
                    couleur: 'blanc',
                    deplacement: 'e3.e4',
                    capture: '',
                    move: 0
                },
                f2: {
                    nom: 'pion',
                    couleur: 'blanc',
                    deplacement: 'f3.f4',
                    capture: '',
                    move: 0
                },
                g2: {
                    nom: 'pion',
                    couleur: 'blanc',
                    deplacement: 'g3.g4',
                    capture: '',
                    move: 0
                },
                h2: {
                    nom: 'pion',
                    couleur: 'blanc',
                    deplacement: 'h3.h4',
                    capture: '',
                    move: 0
                },
                a7: {
                    nom: 'pion',
                    couleur: 'noir',
                    deplacement: 'a6.a5',
                    capture: '',
                    move: 0
                },
                b7: {
                    nom: 'pion',
                    couleur: 'noir',
                    deplacement: 'b6.b5',
                    capture: '',
                    move: 0
                },
                c7: {
                    nom: 'pion',
                    couleur: 'noir',
                    deplacement: 'c6.c5',
                    capture: '',
                    move: 0
                },
                d7: {
                    nom: 'pion',
                    couleur: 'noir',
                    deplacement: 'd6.d5',
                    capture: '',
                    move: 0
                },
                e7: {
                    nom: 'pion',
                    couleur: 'noir',
                    deplacement: 'e6.e5',
                    capture: '',
                    move: 0
                },
                f7: {
                    nom: 'pion',
                    couleur: 'noir',
                    deplacement: 'f6.f5',
                    capture: '',
                    move: 0
                },
                g7: {
                    nom: 'pion',
                    couleur: 'noir',
                    deplacement: 'g6.g5',
                    capture: '',
                    move: 0
                },
                h7: {
                    nom: 'pion',
                    couleur: 'noir',
                    deplacement: 'h6.h5',
                    capture: '',
                    move: 0
                }
            }
        };
        this.jeu._50_coup = 0;
    },
    _load_game: function (data) {
        this._move(data.pion, data.depart, data.arriver, data.mouvement, data.promotion);
    },
    _in_array: function (value, array) {

        for (var i = 0; i < array.length; i++) {
            if (array[i] == value) {
                return true;
            }
        }

        return false;
    },
    _move: function (pion, depart, arriver, mouvement, promotion) {

        if (mouvement == 'deplace') {

            var extension = '',
                signe = ' ';

            if (pion.nom == 'roi' && pion.move == 0) {

                reg = new RegExp('^(c1|g1|c8|g8)$');

                if (reg.test(arriver)) {

                    var lettre = arriver.substr(0, 1),
                        chiffre = arriver.substr(-1);

                    switch (lettre) {

                    case 'c':

                        this.jeu.position['d' + chiffre] = {
                            nom: this.jeu.position['a' + chiffre].nom,
                            couleur: this.jeu.position['a' + chiffre].couleur,
                            deplacement: '',
                            capture: '',
                            move: 1
                        };

                        delete this.jeu.position['a' + chiffre];

                        extension = ' 0-0-0';

                        break;

                    case 'g':

                        this.jeu.position['f' + chiffre] = {
                            nom: this.jeu.position['h' + chiffre].nom,
                            couleur: this.jeu.position['h' + chiffre].couleur,
                            deplacement: '',
                            capture: '',
                            move: 1
                        };

                        delete this.jeu.position['h' + chiffre];

                        extension = ' 0-0';

                        break;

                    }
                }
            }
        } else if (mouvement == 'capture') {

            var extension = '',
                signe = 'x',
                piece = '';

            if (!this.jeu.position[arriver]) {

                piece = this._prise_passant(arriver);

                extension = ' e.p.';
            } else {

                piece = this.jeu.position[arriver].nom;
            }


            if (pion.couleur == 'blanc') {

                this.jeu.noir.pieces = this.jeu.noir.pieces - 1;
            } else {

                this.jeu.blanc.pieces = this.jeu.blanc.pieces - 1;
            }
        }

        this.position_en_passant = [];

        if (this.jeu.position[depart].nom == 'pion') {

            if (this.jeu.position[depart].move == 0) {

                if (this.jeu.position[depart].couleur == 'blanc') {

                    var _prise = 3,
                        _arriver = 4;
                } else {

                    var _prise = 6,
                        _arriver = 5;
                }

                this.chiffre = arriver.substr(-1);

                if (this.chiffre == _arriver) {

                    var lettre = arriver.substr(0, 1);

                    this.prise_en_passant = lettre + _prise;

                    var lettre = this._lettre_chiffre(lettre);

                    this.lettre = lettre + 1;

                    if (this._verif_position()) {

                        this.position_en_passant.push(this._position());
                    }

                    this.lettre = lettre - 1;

                    if (this._verif_position()) {

                        this.position_en_passant.push(this._position());
                    }
                }
            }
        }

        delete this.jeu.position[depart];

        this.jeu.position[arriver] = {
            nom: pion.nom,
            couleur: pion.couleur,
            deplacement: '',
            capture: '',
            move: 1
        };

        if (pion.nom == 'roi') {
            this.jeu[pion.couleur].roi.position = arriver;
        }

        if (pion.nom == 'pion' || mouvement == 'capture') {
            this.jeu._50_coup = 0;
        } else {
            this.jeu._50_coup++;
        }

        if (pion.nom == 'pion' && arriver.substr(-1) == 1 || pion.nom == 'pion' && arriver.substr(-1) == 8) {
            this.jeu.position[arriver].nom = this.getPromotion(promotion);
            this._charge(depart, arriver, pion, mouvement, false);
        } else {

            this._charge(depart, arriver, pion, mouvement, false);
        }
    },
    getPromotion: function (promotion) {
        switch(promotion) {
            case 'queen': return 'reine';
            case 'rook': return 'tour';
            case 'bishop': return 'fou';
            case 'knight': return 'cavalier';
        }
    },
    _prise_passant: function (arriver) {

        var pion = '',
            lettre = arriver.substr(0, 1),
            chiffre = arriver.substr(-1);

        switch (chiffre) {

        case '3':
            pion = this.jeu.position[lettre + '4'].nom;

            delete this.jeu.position[lettre + '4'];

            break;

        case '6':
            pion = this.jeu.position[lettre + '5'].nom;

            delete this.jeu.position[lettre + '5'];

            break;

        }

        return pion;
    },

    _charge: function (depart, arriver, pion, mouvement, promotion) {

        if (this.jeu.tour == 'blanc') {
            this.jeu.tour = 'noir';
        } else {
            this.jeu.tour = 'blanc';
        }

        this.jeu.blanc.roi.deplacement_interdit = [];
        this.jeu.noir.roi.deplacement_interdit = [];

        this.roi_echec = false;
        this.roi_echec_deplacement = false;

        var couleur = ["blanc", "noir"];

        for (var i in couleur) {

            this.pion_position = this.jeu[couleur[i]].roi.position;
            this.pion_couleur = couleur[i];

            var lettre = parseInt(this._lettre_chiffre(this.pion_position.substr(0, 1))),
                chiffre = parseInt(this.pion_position.substr(-1));

            this.lettre = lettre;
            this.chiffre = chiffre + 1;
            this._verif_roi_interdit();

            this.chiffre = chiffre - 1;
            this._verif_roi_interdit();

            this.lettre = lettre - 1;
            this._verif_roi_interdit();

            this.chiffre = chiffre + 1;
            this._verif_roi_interdit();

            this.lettre = lettre + 1;
            this._verif_roi_interdit();

            this.chiffre = chiffre - 1;
            this._verif_roi_interdit();

            this.chiffre = chiffre;
            this._verif_roi_interdit();

            this.lettre = lettre - 1;
            this._verif_roi_interdit();

        }

        for (var i in this.jeu.position) {

            var pion = this.jeu.position[i];

            if (this.jeu.tour == pion.couleur && pion.nom != 'roi') {

                if (this.jeu[pion.couleur].pieces < 3) {

                    this.options[pion.couleur].piece_reste = {
                        nom: pion.nom,
                        position: i
                    };
                }

                this.pion_position = i;
                this.pion_nom = pion.nom;
                this.pion_couleur = pion.couleur;
                this.pion_deplacement = pion.deplacement;
                this.pion_move = pion.move;

                this._deplacement();

                var deplacement = '',
                    capture = '';

                if (this.deplacement.length > 0) {
                    deplacement = this.deplacement.join('.');
                }

                if (this.capture.length > 0) {
                    capture = this.capture.join('.');
                }


                this.jeu.position[i].deplacement = deplacement;
                this.jeu.position[i].capture = capture;
            }
        }

        for (var i in this.jeu.position) {

            var pion = this.jeu.position[i];

            if (this.jeu.tour != pion.couleur && pion.nom != 'roi') {

                if (this.jeu[pion.couleur].pieces < 3) {

                    this.options[pion.couleur].piece_reste = {
                        nom: pion.nom,
                        position: i
                    };
                }

                this.pion_position = i;
                this.pion_nom = pion.nom;
                this.pion_couleur = pion.couleur;
                this.pion_deplacement = pion.deplacement;
                this.pion_move = pion.move;

                this._deplacement();

                var deplacement = "";
                var capture = "";

                if (this.deplacement.length > 0) {
                    deplacement = this.deplacement.join('.');
                }

                if (this.capture.length > 0) {
                    capture = this.capture.join('.');
                }


                this.jeu.position[i].deplacement = deplacement;
                this.jeu.position[i].capture = capture;

            }
        }

        this.nul = false;

        if (this.jeu.blanc.pieces < 3 && this.jeu.noir.pieces < 3) {

            if (this.jeu.blanc.pieces == 1 && this.jeu.noir.pieces == 1) {
                this.nul = true;
            } else if (this.jeu.blanc.pieces == 1) {

                switch (this.options.noir.piece_reste.nom) {

                case 'cavalier':
                case 'fou':

                    this.nul = true;

                    break;
                }
            } else if (this.jeu.noir.pieces == 1) {

                switch (this.options.blanc.piece_reste.nom) {

                case 'cavalier':
                case 'fou':

                    this.nul = true;

                    break;
                }
            } else if (this.options.blanc.piece_reste.nom == 'fou' && this.options.noir.piece_reste.nom == 'fou') {

                var lettre = this._lettre_chiffre(this.options.blanc.piece_reste.position.substr(0, 1)),
                    chiffre = this.options.blanc.piece_reste.position.substr(-1);

                var blanc = parseInt(lettre) + parseInt(chiffre);

                var lettre = this._lettre_chiffre(this.options.noir.piece_reste.position.substr(0, 1)),
                    chiffre = this.options.noir.piece_reste.position.substr(-1);

                var noir = parseInt(lettre) + parseInt(chiffre);

                if (blanc % 2 == noir % 2) {
                    this.nul = true;
                }
            }
        }

        this.pat = true;

        for (var i in this.jeu.position) {

            var pion = this.jeu.position[i];

            if (pion.nom == 'roi') {

                this.pion_position = i;
                this.pion_nom = pion.nom;
                this.pion_couleur = pion.couleur;
                this.pion_deplacement = pion.deplacement;
                this.pion_move = pion.move;

                this._deplacement();

                var deplacement = '',
                    capture = '';

                if (this.deplacement.length > 0) {

                    deplacement = this.deplacement.join('.');

                    if (this.jeu.tour == this.pion_couleur) {
                        this.pat = false;
                    }
                }

                if (this.capture.length > 0) {

                    capture = this.capture.join('.');

                    if (this.jeu.tour == this.pion_couleur) {
                        this.pat = false;
                    }
                }

                this.jeu.position[i].deplacement = deplacement;
                this.jeu.position[i].capture = capture;

            } else if (this.pat == true && this.jeu.tour == pion.couleur) {

                if (pion.deplacement || pion.capture) {
                    this.pat = false;
                }
            }
        }

        this.mat = false;

        if (this.roi_echec) {

            this.mat = true;

            var key = this.jeu[this.jeu.tour].roi.position,
                pion = this.jeu.position[key];

            if (pion.deplacement || pion.capture) {
                this.mat = false;
            }

            for (var i in this.jeu.position) {

                var pion = this.jeu.position[i];

                if (this.jeu.tour == pion.couleur && pion.nom != 'roi') {

                    var deplacement = [],
                        capture = '';

                    if (this.roi_echec == 1) {

                        if (pion.deplacement) {

                            if (this.roi_echec_deplacement) {

                                for (var a in this.roi_echec_deplacement) {

                                    var val = this.roi_echec_deplacement[a];

                                    var _deplacement = pion.deplacement.split('.');

                                    if (this._in_array(val, _deplacement)) {

                                        this.mat = false;

                                        deplacement.push(val);
                                    }
                                }
                            }
                        }

                        if (pion.capture) {

                            var _capture = pion.capture.split('.');

                            if (this._in_array(this.roi_echec_capture, _capture)) {

                                this.mat = false;

                                capture = this.roi_echec_capture;
                            }
                        }
                    }

                    var deplacement = (deplacement.length > 0) ? deplacement.join('.') : '';

                    this.jeu.position[i].deplacement = deplacement;
                    this.jeu.position[i].capture = capture;
                }
            }
        }

        if (!this.jeu.coup) {
            this.jeu.coup = 0;
        }

        var _position = [];

        for (var i in this.jeu.position) {
            _position.push(i);
        }

        _position.sort();

        var val = '';

        for (var i in _position) {
            val += _position[i] + this.jeu.position[_position[i]].nom + this.jeu.position[_position[i]].couleur;
        }

        this.jeu.coup++;

        if (this.mat == true) {

            this.jeu.terminer = 1;
            this.jeu.resultat.nom = 'mat';

            if (this.jeu.tour == 'noir') {
                this.jeu.resultat.vainqueur = 1;
            } else {
                this.jeu.resultat.vainqueur = 2;
            }
        } else if (this.pat == true || this.nul == true) {

            this.jeu.terminer = 1;
            this.jeu.resultat.vainqueur = 0;

            if (this.pat == true) {
                this.jeu.resultat.nom = 'pat';
            } else {
                this.jeu.resultat.nom = 'nul';
            }
        }

        this.jeu.blanc.roi.deplacement_interdit = '';
        this.jeu.noir.roi.deplacement_interdit = '';
    },

    _deplacement: function () {

        this.sauvegarde_capture = '';
        this.deplacement_avant_roi = '';
        this.deplacement = [];
        this.capture = [];

        var lettre = parseInt(this._lettre_chiffre(this.pion_position.substr(0, 1))),
            chiffre = parseInt(this.pion_position.substr(-1));

        switch (this.pion_nom) {

        case 'roi':

            if (this.roi_echec == false && this.pion_move == 0) {
                this._verif_roque();
            }

            this.lettre = lettre;
            this.chiffre = chiffre + 1;
            this._verif_roi();

            this.chiffre = chiffre - 1;
            this._verif_roi();

            this.lettre = lettre - 1;
            this._verif_roi();

            this.chiffre = chiffre + 1;
            this._verif_roi();

            this.lettre = lettre + 1;
            this._verif_roi();

            this.chiffre = chiffre - 1;
            this._verif_roi();

            this.chiffre = chiffre;
            this._verif_roi();

            this.lettre = lettre - 1;
            this._verif_roi();

            break;

        case 'reine':
        case 'tour':

            this.stop = false;
            this.roi_echec_interdit = false;
            this._deplacement_avant_roi = [];
            this._deplacement_echec_roi = [];

            for (this.i = 1; this.i < 9; this.i++) {

                this.lettre = lettre;
                this.chiffre = chiffre + this.i;
                this._verif_reine_tour_fou();
            }


            this.stop = false;
            this.roi_echec_interdit = false;
            this._deplacement_avant_roi = [];
            this._deplacement_echec_roi = [];

            for (this.i = 1; this.i < 9; this.i++) {

                this.lettre = lettre + this.i;
                this.chiffre = chiffre;
                this._verif_reine_tour_fou();
            }


            this.stop = false;
            this.roi_echec_interdit = false;
            this._deplacement_avant_roi = [];
            this._deplacement_echec_roi = [];

            for (this.i = 1; this.i < 9; this.i++) {

                this.lettre = lettre;
                this.chiffre = chiffre - this.i;
                this._verif_reine_tour_fou();
            }

            this.stop = false;
            this.roi_echec_interdit = false;
            this._deplacement_avant_roi = [];
            this._deplacement_echec_roi = [];

            for (this.i = 1; this.i < 9; this.i++) {

                this.lettre = lettre - this.i;
                this.chiffre = chiffre;
                this._verif_reine_tour_fou();
            }


            if (this.pion_nom == 'tour') {
                break;
            }

        case 'reine':
        case 'fou':

            this.stop = false;
            this.roi_echec_interdit = false;
            this._deplacement_avant_roi = [];
            this._deplacement_echec_roi = [];

            for (this.i = 1; this.i < 9; this.i++) {

                this.lettre = lettre + this.i;
                this.chiffre = chiffre + this.i;
                this._verif_reine_tour_fou();

            }

            this.stop = false;
            this.roi_echec_interdit = false;
            this._deplacement_avant_roi = [];
            this._deplacement_echec_roi = [];

            for (this.i = 1; this.i < 9; this.i++) {

                this.lettre = lettre - this.i;
                this.chiffre = chiffre - this.i;
                this._verif_reine_tour_fou();

            }

            this.stop = false;
            this.roi_echec_interdit = false;
            this._deplacement_avant_roi = [];
            this._deplacement_echec_roi = [];

            for (this.i = 1; this.i < 9; this.i++) {

                this.lettre = lettre + this.i;
                this.chiffre = chiffre - this.i;
                this._verif_reine_tour_fou();

            }

            this.stop = false;
            this.roi_echec_interdit = false;
            this._deplacement_avant_roi = [];
            this._deplacement_echec_roi = [];

            for (this.i = 1; this.i < 9; this.i++) {

                this.lettre = lettre - this.i;
                this.chiffre = chiffre + this.i;
                this._verif_reine_tour_fou();

            }

            break;

        case 'cavalier':

            this.lettre = lettre - 2;
            this.chiffre = chiffre - 1;
            this._verif_cavalier();

            this.chiffre = chiffre + 1;
            this._verif_cavalier();

            this.lettre = lettre + 2;
            this._verif_cavalier();

            this.chiffre = chiffre - 1;
            this._verif_cavalier();

            this.lettre = lettre + 1;
            this.chiffre = chiffre + 2;
            this._verif_cavalier();

            this.chiffre = chiffre - 2;
            this._verif_cavalier();

            this.lettre = lettre - 1;
            this._verif_cavalier();

            this.chiffre = chiffre + 2;
            this._verif_cavalier();

            break;

        case 'pion':

            if (this.prise_en_passant && this.jeu.tour == this.pion_couleur) {

                if (this._in_array(this.pion_position, this.position_en_passant)) {

                    this.capture.push(this.prise_en_passant);
                }
            }

            if (this.pion_couleur == 'blanc') {
                this.chiffre = chiffre + 1;
            } else {
                this.chiffre = chiffre - 1;
            }

            this.lettre = lettre + 1;
            this._verif_capture_pion();

            this.lettre = lettre - 1;
            this._verif_capture_pion();

            this.lettre = lettre;
            this._verif_deplacement_pion();

            if (this.deplacement.length > 0) {

                if (this.pion_move == 0) {

                    if (this.pion_couleur == 'blanc') {
                        this.chiffre = chiffre + 2;
                    } else {
                        this.chiffre = chiffre - 2;
                    }

                    this.lettre = lettre;
                    this._verif_deplacement_pion();
                }
            }

            break;
        }

    },

    _verif_roque: function () {

        if (this.pion_couleur == 'blanc') {
            var _chiffre = 1,
                _couleur = 'noir';
        } else {
            var _chiffre = 8,
                _couleur = 'blanc';
        }

        var roi_interdit = this.jeu[_couleur].roi.deplacement_interdit;

        if (this.jeu.position['a' + _chiffre]) {

            var nom = this.jeu.position['a' + _chiffre].nom,
                couleur = this.jeu.position['a' + _chiffre].couleur,
                move = this.jeu.position['a' + _chiffre].move;

            if (nom == 'tour' && couleur == this.pion_couleur && move == 0) {

                var deplacement = this.jeu.position['a' + _chiffre].deplacement;

                reg = new RegExp('b' + _chiffre + '.c' + _chiffre + '.d' + _chiffre);

                if (reg.test(deplacement) && !this._in_array('b' + _chiffre, roi_interdit) && !this._in_array('c' + _chiffre, roi_interdit) && !this._in_array('d' + _chiffre, roi_interdit)) {

                    this.deplacement.push('c' + _chiffre);
                }
            }
        }

        if (this.jeu.position['h' + _chiffre]) {

            var nom = this.jeu.position['h' + _chiffre].nom,
                couleur = this.jeu.position['h' + _chiffre].couleur,
                move = this.jeu.position['h' + _chiffre].move;

            if (nom == 'tour' && couleur == this.pion_couleur && move == 0) {

                var deplacement = this.jeu.position['h' + _chiffre].deplacement;

                reg = new RegExp('g' + _chiffre + '.f' + _chiffre);

                if (reg.test(deplacement) && !this._in_array('g' + _chiffre, roi_interdit) && !this._in_array('f' + _chiffre, roi_interdit)) {

                    this.deplacement.push('g' + _chiffre);
                }
            }
        }
    },

    _verif_roi_interdit: function () {

        if (this._verif_position()) {
            this.jeu[this.pion_couleur].roi.deplacement_interdit.push(this._position());
        }
    },

    _verif_roi: function () {

        if (this._verif_position()) {

            this.position = this._position();

            if (this._verif_capture_roi()) {
                this.capture.push(this.position);
            } else if (this._verif_deplacement_roi()) {
                this.deplacement.push(this.position);
            }
        }
    },

    _verif_capture_roi: function () {

        if (this._verif_capture()) {

            var couleur = (this.pion_couleur == 'blanc') ? 'noir' : 'blanc';

            return !this._in_array(this.position, this.jeu[couleur].roi.deplacement_interdit);
        }
    },

    _verif_deplacement_roi: function () {

        if (this._verif_deplacement()) {

            var couleur = (this.pion_couleur == 'blanc') ? 'noir' : 'blanc';

            return !this._in_array(this.position, this.jeu[couleur].roi.deplacement_interdit);
        }
    },

    _verif_reine_tour_fou: function () {

        if (this._verif_position()) {

            this.position = this._position();

            if (this.stop == false) {

                if (this._verif_capture()) {

                    this.capture.push(this.position);

                    this.sauvegarde_capture = this.position;

                    if (this.jeu.tour != this.pion_couleur) {

                        var couleur = (this.pion_couleur == 'blanc') ? 'noir' : 'blanc';

                        if (this.jeu[couleur].roi.position == this.position) {

                            this.roi_echec++;
                            this.roi_echec_deplacement = this._deplacement_echec_roi;
                            this.roi_echec_capture = this.pion_position;
                            this.roi_echec_interdit = true;
                        }

                        this.stop = true;

                    } else {
                        this.i = 8;
                    }
                } else if (this._verif_deplacement()) {

                    this.deplacement.push(this.position);
                    this._deplacement_avant_roi.push(this.position);
                    this._deplacement_echec_roi.push(this.position);

                    this.jeu[this.pion_couleur].roi.deplacement_interdit.push(this.position);

                } else {

                    this.jeu[this.pion_couleur].roi.deplacement_interdit.push(this.position);

                    this.i = 8;
                }
            } else if (this.jeu.tour != this.pion_couleur) {

                var couleur = (this.pion_couleur == 'blanc') ? 'noir' : 'blanc';

                if (this._verif_capture()) {

                    if (this.jeu[couleur].roi.position == this.position) {

                        this.capture_avant_roi = this.sauvegarde_capture;

                        this.deplacement_avant_roi = this._deplacement_avant_roi;

                        this._piece_avant_roi();
                    }

                    this.i = 8;
                } else if (this._verif_deplacement()) {

                    if (this.roi_echec_interdit == true) {

                        this.jeu[this.pion_couleur].roi.deplacement_interdit.push(this.position);
                    }

                    this._deplacement_avant_roi.push(this.position);

                } else {

                    if (this.roi_echec_interdit == true) {

                        this.jeu[this.pion_couleur].roi.deplacement_interdit.push(this.position);
                    }

                    this.i = 8;
                }
            } else {

                this.i = 8;
            }
        }
    },

    _piece_avant_roi: function () {

        if (this.pion_nom == 'reine' || this.pion_nom == 'tour' || this.pion_nom == 'fou') {

            var key = this.sauvegarde_capture;

            var pion_nom = this.jeu.position[key].nom,
                pion_deplacement = this.jeu.position[key].deplacement,
                pion_capture = this.jeu.position[key].capture,
                pion_move = this.jeu.position[key].move;

            var deplacement = '',
                capture = '';

            if (pion_nom == 'reine' || this.pion_nom == pion_nom) {

                capture = this.pion_position;

                if (this.deplacement_avant_roi) {

                    deplacement = this.deplacement_avant_roi.join('.');
                }
            } else if (this.pion_nom == 'reine' && pion_nom != 'cavalier' && pion_nom != 'pion') {

                var _capture = pion_capture.split('.');

                if (this._in_array(this.pion_position, _capture)) {

                    capture = this.pion_position;

                    if (this.deplacement_avant_roi) {

                        deplacement = this.deplacement_avant_roi.join('.');
                    }
                }
            } else if (pion_nom == 'pion') {

                var lettre = this._lettre_chiffre(this.pion_position.substr(0, 1)),
                    lettre_pion = this._lettre_chiffre(key.substr(0, 1));

                var _deplacement = pion_deplacement.split('.');

                if (lettre == lettre_pion && !this._in_array(this.pion_position, _deplacement)) {

                    deplacement = pion_deplacement;
                }

                var _capture = pion_capture.split('.');

                if (this._in_array(this.pion_position, _capture)) {

                    capture = this.pion_position;
                }
            }

            this.jeu.position[key].deplacement = deplacement;
            this.jeu.position[key].capture = capture;
        }

    },


    _verif_cavalier: function () {

        if (this._verif_position()) {

            this.position = this._position();

            if (this._verif_capture()) {

                this.capture.push(this.position);

            } else if (this._verif_deplacement()) {

                this.deplacement.push(this.position);

            }

            var couleur = (this.pion_couleur == 'blanc') ? 'noir' : 'blanc';

            if (this.jeu.tour != this.pion_couleur) {

                if (this.jeu[couleur].roi.position == this.position) {

                    this.roi_echec++;

                    this.roi_echec_capture = this.pion_position;
                }
            }

            this.jeu[this.pion_couleur].roi.deplacement_interdit.push(this.position);

        }

    },

    _verif_capture_pion: function () {

        if (this._verif_position()) {

            this.position = this._position();

            if (this._verif_capture()) {

                this.capture.push(this.position);
            }

            if (this.jeu.tour != this.pion_couleur) {

                var couleur = (this.pion_couleur == 'blanc') ? 'noir' : 'blanc';

                if (this.jeu[couleur].roi.position == this.position) {

                    this.roi_echec++;

                    this.roi_echec_capture = this.pion_position;

                }

            }

            this.jeu[this.pion_couleur].roi.deplacement_interdit.push(this.position);
        }

    },

    _verif_deplacement_pion: function () {

        if (this._verif_position()) {

            this.position = this._position();

            if (this._verif_deplacement()) {

                this.deplacement.push(this.position);

            }
        }
    },

    _verif_capture: function () {

        if (this._verif_piece()) {

            return this.jeu.position[this.position].couleur != this.pion_couleur;

        }

    },

    _verif_deplacement: function () {

        return !this.jeu.position[this.position];
    },

    _verif_piece: function () {

        return this.jeu.position[this.position];

    },

    _verif_position: function () {

        return this.lettre > 0 && this.lettre < 9 && this.chiffre > 0 && this.chiffre < 9;
    },

    _position: function () {

        return this._chiffre_lettre(this.lettre) + this.chiffre;
    },

    _chiffre_lettre: function (chiffre) {

        switch (chiffre) {

        case 1:
            return 'a';
        case 2:
            return 'b';
        case 3:
            return 'c';
        case 4:
            return 'd';
        case 5:
            return 'e';
        case 6:
            return 'f';
        case 7:
            return 'g';
        case 8:
            return 'h';
        }
    },

    _lettre_chiffre: function (lettre) {

        switch (lettre) {

        case 'a':
            return 1;
        case 'b':
            return 2;
        case 'c':
            return 3;
        case 'd':
            return 4;
        case 'e':
            return 5;
        case 'f':
            return 6;
        case 'g':
            return 7;
        case 'h':
            return 8;
        }
    },
};

function getNextMove(game) {
    var possibleMove = [];
    for (var position in game.pieces) {
        var piece = game.pieces[position];
        if (piece.color !== game.turn) {
            continue;
        }

        if (piece.deplace.length) {
            for (var key in piece.deplace) {
                var value = piece.deplace[key],
                    promotion = null;

                if (piece.name == 'pawn' && (value.substr(-1) == 1 || value.substr(-1) == 8)) {
                    var pieces = ['queen', 'rook', 'bishop', 'knight'];
                    promotion = pieces[Math.floor(Math.random() * pieces.length)];
                }
                possibleMove.push({
                    start: position,
                    end: value,
                    move: 'deplace',
                    promotion: promotion
                });
            } 
        }

        if (piece.capture.length) {
            for (var key in piece.capture) {
                var value = piece.capture[key],
                    promotion = null;

                if (piece.name == 'pawn' && (value.substr(-1) == 1 || value.substr(-1) == 8)) {
                    var pieces = ['queen', 'rook', 'bishop', 'knight'];
                    promotion = pieces[Math.floor(Math.random() * pieces.length)];
                }
                possibleMove.push({
                    start: position,
                    end: value,
                    move: 'capture',
                    promotion: promotion
                });
            } 
        }
    }

    return possibleMove[Math.floor(Math.random() * possibleMove.length)];;
}

global.dirname = __dirname + '/..';

var moduleGame = require(__dirname + '/game/game')(),
    assert = require(__dirname + '/assert')(),
    gid = 1;

setInterval(function() {
    game.newGame();
    moduleGame.newGame(gid);
    run(gid++);
}, 500);


function run(gid) {

    if (moduleGame.game.finish) {
        console.log('success', gid);
        return;
    }

    var nextMove = getNextMove(moduleGame.game);

    moduleGame.move(nextMove.start, nextMove.end, nextMove.promotion);

    game._load_game({
        pion: game.jeu.position[nextMove.start],
        depart: nextMove.start, 
        arriver: nextMove.end, 
        mouvement: nextMove.move, 
        promotion: nextMove.promotion
    });

    var oldGame = assert.setOldGame(JSON.parse(JSON.stringify(game.jeu))),
        newGame = assert.setNewGame(JSON.parse(JSON.stringify(moduleGame.game))),
        result  = assert.checkGame(oldGame, newGame);

    if (result !== true) {
        console.log('error', result);
        return;
    }

    return run(gid);
}