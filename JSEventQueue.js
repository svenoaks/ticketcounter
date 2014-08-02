
function flyAirplane()
{
	var plane = $("#plane")
	plane.animate( { bottom: "+=1500" }, 3000, function() {
		plane.css( { "bottom": "-=1500", "opacity":"0" } );
	});
}

function test()
{
	//resetUI();
}



function Event(time, type)
{
	this.time = time;
	this.type = type;
}

Event.prototype.valueOf = function() { return this.time; }

function EventQueue(priorityQueueImp)
{
	this.priorityQueue = priorityQueueImp;
	
	this.isEmpty = function isEmpty()
	{
		return this.priorityQueue.isEmpty();
	}
	
	this.add = function add(event)
	{
		this.priorityQueue.insert(new BinaryHeapNode(event));
	}
	
	this.removeNextEvent = function removeNextEvent()
	{
		return this.priorityQueue.removeMin();
	}
	
	this.peekNextEvent = function peekNextEvent()
	{
		return this.priorityQueue.peekNext();
	}
}
function addRandomEventsToQueue(eventQueue, numberOfEvents, maxArrivalTime)
{
	for (var i = 0; i < numberOfEvents; ++i)
	{
		var arrivalTime = Math.floor(Math.random() * maxArrivalTime) + 1
		eventQueue.add(new Event(arrivalTime, "Customer Arrival"));
	}
}

function askUserForNumberOfAgents()
{
	var numberOfAgents = 0;
	while (numberOfAgents < 2 || numberOfAgents > 5)
	{
		numberOfAgents = prompt("Enter number of Agents 2-5", "2");
	}
	return numberOfAgents;
}

function msToSeconds(ms)
{
	return ms / 1000.0;
}

function lockUI(shouldBeLocked)
{
	document.getElementById("startSimulation").disabled = shouldBeLocked;
}

function changeCounterUI(id, value)
{
	document.getElementById(id).innerHTML = value;
}

function numberOfFreeAgents(agents)
{
	var count = 0;
	$.each(agents, function(index, value) {
		if(!value)
			++count;
	});
	return count;
}
function doSimulation()
{
	lockUI(true);
	
	const MAX_NO_OF_EVENTS = 49;
	const MAX_ARRIVAL_TIME = 60;
	const HANDLE_TIME = 3100;
	const LOOP_POLL_MS = 500;
	const MAX_WAITING_LINE = 20;
	
	var eventsRemaining = MAX_NO_OF_EVENTS;
	var totalWaitingTime = 0;
	var salesAgents = [];
	var waitingLine = [];
	var numberOfAgents = askUserForNumberOfAgents();
	
    var timeStarted = new Date();
	var eventQueue = new EventQueue(new BinaryHeap());
	
	addRandomEventsToQueue(eventQueue, MAX_NO_OF_EVENTS, MAX_ARRIVAL_TIME);
	
	changeCounterUI("agents", numberOfAgents);
	changeCounterUI("remaining", MAX_NO_OF_EVENTS);
	
	for(var i = 0; i < numberOfAgents; ++i)
	{
		//bool is if the ticketCounter at i is busy.
		salesAgents.push(false);
		$(".counter").eq(i).animate({opacity:1}, 600);
	}
	
	var serviceLoop = setInterval(serviceQueue, LOOP_POLL_MS);
	
	function moveMan(from, to, plane)
	{
		(function() {
		
			var tmp_from = from;
			var tmp_to = to;
			var tmp_plane = plane;
			var pos = tmp_from.offset();
			var temp = tmp_from.clone(true);
	
			temp.css({ "visibility":"visible",
					"position":"absolute",
					"top":pos.top + "px",
					"left":pos.left + "px"});
			temp.appendTo("body");
			tmp_from.css("visibility", "hidden");
			//if (!tmp_plane) tmp_to.css("visibility", "hidden");
			temp.animate(to.offset(), moveMan.ANIMATION_TIME, function() {
				tmp_to.css("visibility", "visible");
				temp.remove();
			});
		})();
	}
	moveMan.ANIMATION_TIME_MS = 200;
	
	function serviceQueue()
	{
		//syncWaitingLine();
		var timeNow = new Date();
		
		//the waiting line has a man and there's a free agent
		if (waitingLine.length != 0 && 
				numberOfFreeAgents(salesAgents) > 0)
		{
			var currentEvent = waitingLine.shift();
			var man = $(".waitingman").eq(0);
			serviceEvent(currentEvent, man);
			for (var i = 1; i < waitingLine.length + 1; ++i)
			{
				var man = $(".waitingman").eq(i);
				var newMan = $(".waitingman").eq(i - 1);
				moveMan(man, newMan);
			}
		}
		else
		{
			var nextEvent = eventQueue.peekNextEvent();
			
			if (nextEvent != null && 
					msToSeconds(timeNow - timeStarted) >= nextEvent.time)
			{
				var currentEvent = eventQueue.removeNextEvent();
				var pendingman = $(".pendingman").eq(MAX_NO_OF_EVENTS - eventsRemaining);
				changeCounterUI("remaining", --eventsRemaining);
				
				if (numberOfFreeAgents(salesAgents) > 0)
				{
					serviceEvent(currentEvent, pendingman);
				}
				else
				{
					currentEvent.startedWaiting = timeNow;
					waitingLine.push(currentEvent);
					var waitingman = $(".waitingman").eq(waitingLine.length - 1);
					changeCounterUI("waiting", waitingLine.length);
					moveMan(pendingman, waitingman);
				}
			}
		}
		/*
		if ($(":animated").length != 0)
			clearInterval(serviceLoop);
		$(":animated").promise().done(function() {
    		serviceLoop = setInterval(serviceQueue, LOOP_POLL_MS);
		});
		*/
	}
	
	function assignAgent(man)
	{
		var i;
		for(i = 0; i < salesAgents.length; ++i)
		{
			if(!salesAgents[i])
			{
				salesAgents[i] = true;
				break;
			}
		}
		var counter = $(".manatcounter").eq(i);
		moveMan(man, counter);
		return i;
	}
	function freeAgent(index)
	{
		salesAgents[index] = false;
	}
	
	function serviceEvent(currentEvent, man)
	{
		var agentIndex = assignAgent(man);
		changeCounterUI("agents", numberOfFreeAgents(salesAgents));
		
		if (typeof currentEvent.startedWaiting !== 'undefined')
		{
			var timeNow = new Date();
			totalWaitingTime += timeNow - currentEvent.startedWaiting;
			changeCounterUI("waiting", waitingLine.length);
		}
		
		changeCounterUI("seconds", msToSeconds(totalWaitingTime / (MAX_NO_OF_EVENTS - eventsRemaining))
			.toFixed(2)
			.toString()
			.concat(" minutes"));
			
		setTimeout(function() { var tmp_event = currentEvent; 
		var tmp_index = agentIndex;
		onTransactionComplete(tmp_event, tmp_index); }, HANDLE_TIME);
	}
	
	function onTransactionComplete(currentEvent, agentIndex)
	{
		var man = $(".manatcounter").eq(agentIndex);
		var plane = $("#plane");
		moveMan(man, plane, true);
		freeAgent(agentIndex);
		var freeAgents = numberOfFreeAgents(salesAgents);
		
		changeCounterUI("agents", freeAgents);
		
		if (eventQueue.isEmpty() && waitingLine.length == 0 && freeAgents == salesAgents.length) 
		{
			flyAirplane();
			resetUI();
			clearInterval(serviceLoop);
			lockUI(false);
		}
	}
}
window.onload = function() {
	resetUI();
};
function resetUI()
{
	changeCounterUI("agents", 0);
	$("#plane").animate({opacity:1}, 600);
	$(".counter").animate({opacity:0}, 600);
	$(".pendingman").css({"visibility":"visible", "opacity":"0"});
	$(".pendingman").animate({opacity:1}, 600);
	//$(".waitingman").animate({opacity:0}, 600);
}
