$ = window.jQuery = require('jquery');
var WebMidi = require('webmidi');

const notes = ['C', 'C# / B♭', 'D', 'D# / M♭', 'E', 'F', 'F# / G♭', 'G', 'G# / A♭', 'A', 'A# / B♭', 'B'];
const chordsFr = {
    'C': 'Do majeur', 'Cm': 'Do mineur', 'C# / B♭': 'Do dièse majeur / Ré bémol majeur', 'C#m / B♭m': 'Do dièse mineur / Ré bémol mineur',
    'D': 'Ré majeur', 'Dm': 'Ré mineur', 'D# / M♭': 'Ré dièse majeur / Mi bémol majeur', 'D#m / M♭m': 'Ré dièse mineur / Mi bémol mineur',
    'E': 'Mi majeur', 'Em': 'Mi mineur',
    'F': 'Fa majeur', 'Fm': 'Fa mineur', 'F# / G♭': 'Fa dièse majeur / Sol bémol majeur', 'F#m / G♭m': 'Fa dièse mineur / Sol bémol mineur',
    'G': 'Sol majeur', 'Gm': 'Sol mineur','G# / A♭': 'Sol dièse majeur / La bémol majeur', 'G#m / A♭m': 'Sol dièse mineur / La bémol mineur',
    'A': 'La majeur',  'Am': 'La mineur', 'A# / B♭': 'La dièse majeur / Si bémol majeur', 'A#m / B♭m': 'La dièse mineur / Si bémol mineur'
};
const replaceNotes = {'C#': 'C# / B♭', 'D#': 'D# / M♭', 'F#': 'F# / G♭', 'G#': 'G# / A♭', 'A#': 'A# / B♭'};
var chords = {};


//major chords generator
notes.forEach(function (note) {
    var chord = [note];

    //+ 4 demi ton
    var index = notes.indexOf(note) + 4;
    if (index >= notes.length) {
        index = index - notes.length;
    }
    chord.push(notes[index]);

    //+ 3 demi ton
    index = index + 3;
    if (index >= notes.length) {
        index = index - notes.length;
    }
    chord.push(notes[index]);

    chord.sort();
    chords[chord.join('|')] = note;
});

//minor chords generator
notes.forEach(function (note) {
    var chord = [note];

    //+ 4 demi ton
    var index = notes.indexOf(note) + 3;
    if (index >= notes.length) {
        index = index - notes.length;
    }
    chord.push(notes[index]);

    //+ 3 demi ton
    index = index + 4;
    if (index >= notes.length) {
        index = index - notes.length;
    }
    chord.push(notes[index]);

    chord.sort();
    var part = note.split('/');
    for (var i in part) {
        part[i] = part[i].trim() + 'm';
    }

    chords[chord.join('|')] = part.join(' / ');
});
console.log(chords);

WebMidi.enable(function (err) {

    if (err) {
        console.log("WebMidi could not be enabled.", err);
        return;
    }

    var currentInput = null;
    var currentkeys = [];
    var chordToPlay = null;

    var initMidi = function () {
        var inputs = WebMidi.inputs;

        if (inputs.length > 0) {
            inputs.reverse();

            if (!currentInput) {
                changeInput(inputs[0].id);
            }

            var $select = $('#midi-choice-select');
            $select.empty();
            inputs.forEach(function (input) {
                var selected = currentInput && currentInput.id == input.id
                $select.append('<option value="' + input.id + '" ' + (selected ? 'selected' : '') + '>' + input.name + '</option>');
            });
            $('.main-content').removeClass('disable');
            $('.not-midi-found').hide();
            $('.midi-choice').show();
        } else {
            $('.main-content').addClass('disable');
            $('.not-midi-found').show();
            $('.midi-choice').hide();
        }
    };

    var $chordToPlayAndChordPlay = $('#chord-to-play, #chord-play');
    var $chordPlay = $('#chord-play');
    var $chordPlayNote = $('#chord-play-note');
    var $chordPlayFr = $('#chord-play-fr');
    var $chordToPlay = $('#chord-to-play');
    var $chordToPlayNote = $('#chord-to-play-note');
    var $chordToPlayFr = $('#chord-to-play-fr');
    var $chordPlayHistory = $('#chord-play-history');

    var changeChordToPlay = function () {
        var keys = Object.keys(chords);
        var index = Math.floor(Math.random() * Math.floor(keys.length));
        chordToPlay = keys[index];
        var chord = chords[chordToPlay];
        var choiceChord = chord.split(' / ');
        var choiceChordIndex = Math.floor(Math.random() * Math.floor(choiceChord.length));
        choiceChord = choiceChord[choiceChordIndex];

        $chordToPlayNote.empty().text(' ');
        chordToPlay.split('|').forEach(function(key){
            $chordToPlayNote.append('<span class="badge badge-secondary">' + key + '</span>');
        });

        $chordToPlay.text(choiceChord);
        $chordToPlayFr.text(chordsFr[chord] ? chordsFr[chord] : ' ');
    };

    var addToHistory = function (chord, valid) {
        $chordPlayHistory.prepend('<li class="'+ (valid ? 'valid' : 'error') + '"><strong>' + chord + '</strong> (' + chordsFr[chord]+ ')</li>');
        $chordPlayHistory.find('li').slice(5).remove();
    };

    var onInputKeys = function () {
        console.log('Current keys', currentkeys);
        currentkeys.sort();
        var key = currentkeys.join('|');
        var chord = chords[key] ? chords[key] : '😭';

        $chordPlayNote.html('&nbsp;');
        currentkeys.forEach(function(key){
            $chordPlayNote.append('<span class="badge badge-secondary">' + key + '</span>');
        });

        $chordPlay.text(chord);
        $chordPlayFr.text(chordsFr[chord] ? chordsFr[chord] : ' ');

        if (chord != '😭' && key == chordToPlay) {
            //OK
            addToHistory(chord, true);
            $chordToPlayAndChordPlay.addClass('valid');
            setTimeout(function () {
                $chordToPlayAndChordPlay.removeClass('valid');
                changeChordToPlay();
            }, 1500);
        } else if (chord != '😭' && key != chordToPlay) {
            //KO
            addToHistory(chord, false);
            $chordToPlayAndChordPlay.addClass('error');
            setTimeout(function () {
                $chordToPlayAndChordPlay.removeClass('error');
            }, 1500);
        }
    };

    var changeInput = function(inputId) {
        var input = WebMidi.getInputById(inputId);
        if (currentInput) {
            currentInput.removeListener();
        }
        console.log('Change input', input.name);
        currentInput = input;
        currentkeys = [];

        // Listen for a 'note on' message on all channels
        input.addListener('noteon', "all",
            function (e) {
                console.log(e.note.name);
                var key = replaceNotes[e.note.name] ? replaceNotes[e.note.name] : e.note.name;
                currentkeys.push(key);
                onInputKeys();
            }
        );

        input.addListener('noteoff', "all",
            function (e) {
                var key = replaceNotes[e.note.name] ? replaceNotes[e.note.name] : e.note.name;
                var index = currentkeys.indexOf(key);
                if (index >= 0) {
                    currentkeys.splice(index, 1);
                }
                onInputKeys();
            }
        );
    };


    initMidi();

    setTimeout(function () {
        WebMidi.addListener("connected", function (e) {
            setTimeout(function () { initMidi(); }, 500);
        });

        WebMidi.addListener("disconnected", function (e) {
            if (currentInput && e.port.id == currentInput.id) {
                currentInput = null;
                currentkeys = [];
            }
            setTimeout(function () { initMidi(); }, 500);
        });
    }, 500);


    var $select = $('#midi-choice-select');
    $select.change(function (e) {
        changeInput($select.val())
    });

    changeChordToPlay();
});