// Copyright (c) 2015 Lewis Hunt

// Laddergram Puzzle Solver is a JavaScript app that generates the shortest amount of words from a dictionary - between start and end words - where each term differs by just one letter. Such lists are often used in Word Ladder puzzle games.

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Laddergram.App controls the HTML UI, file-access and calls Laddergram.Model business logic (which is handled seperately in model.js)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// A 'namespace' module pattern is used to safely encaptulate the JavaScript code

var Laddergram = Laddergram || {};

Laddergram.App = (function () { 

	var dictionaryString = "";
	var dictionaryObject = {};
	var resultString = "";


	////////////////////////////////////////////////////////////////////////////////////////////////////
	// main init function gets called when HTML page is fully loaded, passing in the required parameters
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var init = function (dictionaryFile, startWord, endWord) {

		dictionaryString = dictionaryFile;

		document.getElementById("startWord").value = startWord;

		document.getElementById("endWord").value = endWord;
		
		loadFileAsAjax();
	
	};


	////////////////////////////////////////////////////////////////////////////////////////////////////
	// due to javascript security limitations in browser and on server, an ajax xhttprequest promise is used to load dictionary text file.
	// Jquery used to improve compatibility accross browsers. 
	// NOTE: some browsers like Chrome require you to run this page from a localhost server.
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var loadFileAsAjax = function () {
	
		displayResult('Loading Dictionary...');
	
		$.ajax({
		  url : dictionaryString,
		  dataType: "text"
		})
		  .done(function( data ) {
		  
		  	$(".container").addClass('fadeIn');
	  
			processFileData(data);
		
			launchLaddergramProcessor();
		
		  })
	  
		 .fail(function( jqXHR, textStatus ) {
		 	
		 	$(".container").addClass('fadeIn');
		 	
			if (jqXHR.statusText=="error") alert("Unable to load dictionary. Some browsers like Chrome will require you to run this page from a localhost server.");
			else if (jqXHR.statusText=="Not Found") alert("The filename you have entered has not been found. Please try entering a valid filename."); 
		 }); 

	};
	
	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	// before calling business logic we need to convert the dictionary string into an object (and an array for the type-ahead suggestions)
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var processFileData = function (dictionaryString) {
	
		var dictionaryArray = [];

		dictionaryArray = dictionaryString.replace( /\n|\r/g, " " ).split( " " );
	
		//initTypeAheadSuggestions(dictionaryArray);
		
		dictionaryObject = {};
	
		dictionaryArray.forEach(function(el){ 
			if (el!="") dictionaryObject[el] = null;  
		});	
	
	}; 


	////////////////////////////////////////////////////////////////////////////////////////////////////
	// A basic type-ahead suggestion engine to make it easier for the user to enter start and end words
	////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var initTypeAheadSuggestions = function (arrayData) {
	
		var substringMatcher = function(strs) {
		  return function findMatches(q, cb) {
			var matches, substringRegex;

			// an array that will be populated with substring matches
			matches = [];

			// regex used to determine if a string contains the substring `q`
			substrRegex = new RegExp(q, 'i');

			// iterate through the pool of strings and for any string that
			// contains the substring `q`, add it to the `matches` array
			$.each(strs, function(i, str) {
			  if (substrRegex.test(str)) {
				matches.push(str);
			  }
			});

			cb(matches);
		  };
		};	

		$('.typeahead').typeahead('destroy');
	
		$('.typeahead').typeahead({
		  hint: false,
		  highlight: true,
		  minLength: 3
		},
		{
		  name: 'words',
		  source: substringMatcher(arrayData)
		}).keyup(function (e) {
			if(e.which === 13) {
				$(".tt-menu, .tt-hint").hide();
			} 
			if(e.keyCode === 9) return false;          
		});

	};


	////////////////////////////////////////////////////////////
	// display the laddergram result based on input string 
	////////////////////////////////////////////////////////////
	
	var displayResult = function (input) {
		document.getElementById("display").innerHTML = input;
	};


	////////////////////////////////////////////////////////////
	// for small screens ensure the result is scrolled into view
	/////////////////////////////////////////////////////////
	
	var scrollToDisplay = function () {
	
		window.setTimeout( function() {
			$('html, body').animate({ scrollTop: $("#display").offset().top -10});
		}, 100);

	};



	/////////////////////////////////////////////////////////////////////////////////////////
	// Main function that launches the laddergram business logic after checking start/end values
	/////////////////////////////////////////////////////////////////////////////////////////
	
	var launchLaddergramProcessor = function () {
	
		resultString = "";
	
		// grab latest copy of the start/end words
		var startWord = document.getElementById("startWord").value.trim().toLowerCase();
		var endWord   = document.getElementById("endWord").value.trim().toLowerCase();

 		// basic validation to check words are of same length and are found in our word dictionary
		if (startWord.length !== endWord.length) {
			displayResult("Please ensure start and end words are the same length");
			return;
		}
		else if (dictionaryObject[startWord] === undefined) {
			displayResult("'" + startWord + "' is not found in this dictionary");
			return;
		}
		else if (dictionaryObject[endWord] === undefined) {
			displayResult("'" + endWord + "' is not found in this dictionary");
			return;
		}

		// getting ready to call the business logic, first give some user feedback.. 
		displayResult('Finding laddergrams...');

		// call the laddergram business logic after a short timeout - to allow user feedback display
		window.setTimeout( function() {
		
			var laddergramResult = Laddergram.Model.findLaddergram(startWord, endWord, dictionaryObject);

			// business log will return undefined if no connecting laddergram words are found
			if (laddergramResult === undefined) {
				displayResult("Using this dictionary we could not find a laddergram from '" + startWord + "' to '" + endWord + "'");
			}
			// else print out the results from the valid laddergram array
			else {
			
				var resultHTML = "";
				
				displayResult("");
							
				for (var i = 0; i < laddergramResult.length; i++) {
					
					resultString += laddergramResult[i];
					if (i !== laddergramResult.length - 1) resultString  += "\n";					
					
					$('<div class="laddergram" />').text(laddergramResult[i]).appendTo('#display');
					
				}
				
			}	
		
		}, 100);
		

	};

	/////////////////////////////////////////////////////////////////////////////////////////
	// due to javascript security limits on the server and in the browser, we will allow users to save the file locally
	/////////////////////////////////////////////////////////////////////////////////////////

	var saveResultFileAsBlob = function ()
	{
		// don't proceed if there is no valid result
		if (resultString=="") return;
		
		var textToWrite = resultString;
		var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
		var fileNameToSaveAs = document.getElementById("resultFile").value;

		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		if (window.webkitURL != null)
		{
			// Chrome allows the link to be clicked without actually adding it to the DOM.
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		}
		else
		{
			// Firefox requires the link to be added to the DOM before it can be clicked.
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);
		}

		downloadLink.click();
	};

	var destroyClickedElement = function (event)
	{
		document.body.removeChild(event.target);
	};
	
	// expose these methods as public because they are called from the HTML page
	return {
		init: init,
		loadFileAsAjax: loadFileAsAjax,
		launchLaddergramProcessor: launchLaddergramProcessor,
		scrollToDisplay: scrollToDisplay,
		saveResultFileAsBlob: saveResultFileAsBlob

	};

})();