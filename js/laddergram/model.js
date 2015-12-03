// Copyright (c) 2015 Lewis Hunt

// Laddergram Puzzle Solver is a JavaScript app that generates the shortest amount of words from a dictionary - between start and end words - where each term differs by just one letter. Such lists are often used in Word Ladder puzzle games.

////////////////////////////////////////////////////////////////////////////////////////////////////
// Laddergram.Model is the core business logic of the laddergram app that can be tested seperately
////////////////////////////////////////////////////////////////////////////////////////////////////

// A 'namespace' module pattern is used to safely encaptulate the JavaScript code

var Laddergram = Laddergram || {};

Laddergram.Model = (function () { 

	/////////////////////////////////////////////////////////////////////
	// Utility class for a 'Queue' data structure
	// Allows us to efficiently follow a first-in first-out mechanism when managing laddergram 'linked-list' objects
	/////////////////////////////////////////////////////////////////////
	
	function Queue() {
		this._oldestIndex = 1;
		this._newestIndex = 1;
		this._storage = {};
	};
 
	Queue.prototype.size = function() {
		return this._newestIndex - this._oldestIndex;
	};
 
	Queue.prototype.enqueue = function(data) {
		this._storage[this._newestIndex] = data; 
		this._newestIndex++;
	};
 
	Queue.prototype.dequeue = function() {
		var oldestIndex = this._oldestIndex,
			newestIndex = this._newestIndex,
			deletedData;
 
		if (oldestIndex !== newestIndex) {
			deletedData = this._storage[oldestIndex];
			delete this._storage[oldestIndex];
			this._oldestIndex++;
 
			return deletedData;
		}
	};
	
	
	/////////////////////////////////////////////////////////////////////
	// Utility class for a laddergram 'Linked List' data structure
	// Allows us to efficiently build up chained linked lists of words starting with the first word	
	/////////////////////////////////////////////////////////////////////
	
	function LaddergramList(word) {
		this.prev = null;	
		this.word = word;
	};

	// re-useable method to grab the last item in the laddergram linked-list chain
	LaddergramList.prototype.lastItem = function() {
		return this.word;
	};

	// extends the linked-list by creating a new laddergram list that referencing previous list thus creating a linked-list chain
	LaddergramList.prototype.extendList = function(word) {
		var result = new LaddergramList(word);
		result.prev = this;
		return result;
	};

	// finally we will need to convert the chosen linked-list chain to a standard array (and flip reverse)
	LaddergramList.prototype.toArray = function() {
		
		var resultArray = [];

		// traverse back through the chosen linked-list chain and push its words into a results array 
		// note how we reference the 'prev' property to traverse back up the chain to the first word
		for (var validLaddergramList = this; validLaddergramList !== null; validLaddergramList = validLaddergramList.prev) {
			resultArray.push(validLaddergramList.word);
		}

		resultArray.reverse();
		
		return resultArray;    
	};
 
 
 	////////////////////////////////////////////////////////////////////////////////////////////////
	// Main engine for the laddergram word generator.
	// We generate words based on input word and dictionary - but only if the word varies by just one character 
	////////////////////////////////////////////////////////////////////////////////////////////////
	
	var findSimilarWords = function (word, words) {

		var generatedWords = [];
		
		// first loop through each letter of the word
		for (var i = 0; i < word.length; i++) {
			
			// then loop through every possible character for that letter 
			for (var letter = 'a'.charCodeAt(0); letter <= 'z'.charCodeAt(0); letter++) {
				// build up a the new word
				var builtUpWord = word.substring(0, i) + String.fromCharCode(letter) + word.substring(i + 1);
			
				// check if its a word in the dictionary
				if (words[builtUpWord] !== undefined) {
					generatedWords.push(builtUpWord);
				}
			}
		}
		return generatedWords;
	};
	
	 
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Main function that aims to find a laddergram list of words from the start/end words and the dictionary of words.
	// Many laddergram linked-lists are generated/chained and are managed via a Queue data structure 
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var findLaddergram = function (startWord, endWord, words) {

		// Store all potential laddergram linked-lists inside a Queue data structure
		var queueLists = new Queue();
		queueLists.enqueue(new LaddergramList(startWord));

		// keep track of words we may have used already to eliminate dupes
		var usedWords = {};

		// main processing loop while there are items in the Queue
		while (queueLists.size() > 0) {
		
			// obtain the first laddergram linked-list from the queue
			var laddergram = queueLists.dequeue();
			
			// only continue if we havent already processed this word
			if (usedWords[laddergram.lastItem()] !== undefined) continue;

			// then add this new word to the list of used words
			usedWords[laddergram.lastItem()] = null;

			// important - if the current laddergram list of words ends with the destination word, then we have our solution, so end loop
			if (laddergram.lastItem() == endWord) {
				return laddergram.toArray();
			}

			// call the main word generator method to find similar words based on current word
			var similarWords = findSimilarWords(laddergram.lastItem(), words);

			// then for every similar word generated, chain it onto the current list of words and append onto the main Queue of linked-lists
			for (var i = 0; i < similarWords.length; i++) {
				queueLists.enqueue(laddergram.extendList(similarWords[i]));
			}
		}
	};	
	
	// we only need to expose this main method as public (called from Laddergram.app)
	return {
    	findLaddergram: findLaddergram
  	};

})();



/*
////////////////////////////////////////////////////////////
//for testing logic seperately without Laddergram.app and HTML
////////////////////////////////////////////////////////////

var DictionaryObject = {
	"spin": null,
	"spit": null,
	"spat": null,
	"spot": null,
	"span": null
};

var ladder = Laddergram.Model.findLaddergram("spin", "spat", DictionaryObject);

console.log(ladder);

*/
