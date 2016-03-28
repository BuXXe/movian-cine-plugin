/**
 * Movian plugin to watch cine.to streams 
 *
 * Copyright (C) 2015-2016 BuXXe
 *
 *     This file is part of cine.to Movian plugin.
 *
 *  cine.to Movian plugin is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  cine.to Movian plugin is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with cine.to Movian plugin.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  Download from : https://github.com/BuXXe/movian-cine-plugin
 *
 */
   var html = require('showtime/html');

(function(plugin) {

  var PLUGIN_PREFIX = "cine.to:";

  // INFO: Helpful Post Data reader: http://www.posttestserver.com/
  // Resolver-info: 
  // Streamcloud -> resolver working / video working
  // Vivo -> resolver working / video not working (perhaps due to mp4 file format which has also shown bad performance at cloudtime)
  // FlashX -> resolver working / video working -> seems to have only english episodes?
  // Powerwatch -> resolver working / video working
  // Cloudtime -> resolver working / video working (Mobile mp4 version in code had bad performance)
  // Movshare -> resolver working / video working
  // NowVideo -> resolver working / video working
  // VideoWeed -> resolver working / video working
  // YouWatch -> resolver not working 
  // Novamov -> resolver working / video working
  // Ecostream -> resolver working / video working
  // Shared -> resolver working / video working
  // Filenuke -> resolver working / video not working 
  
 
  
  //---------------------------------------------------------------------------------------------------------------------
  
  // returns list [link, filelink] or null if no valid link
  function resolveStreamcloudeu(StreamSiteVideoLink)
  {
	  	var postdata;
	  	var validentries = false;
	  	
    	var getEmissionsResponse = showtime.httpGet(StreamSiteVideoLink);
    	var pattern = new RegExp('<input type="hidden" name="op" value="(.*?)">[^<]+<input type="hidden" name="usr_login" value="(.*?)">[^<]+<input type="hidden" name="id" value="(.*?)">[^<]+<input type="hidden" name="fname" value="(.*?)">[^<]+<input type="hidden" name="referer" value="(.*?)">[^<]+<input type="hidden" name="hash" value="(.*?)">[^<]+<input type="submit" name="imhuman" id="btn_download" class="button gray" value="(.*?)">');
	    var res = pattern.exec(getEmissionsResponse.toString());
	    
	    // File Not Found (404) Error 
	    if(res != null)
	    {
	    	postdata = {op:res[1], usr_login:res[2], id: res[3],fname:res[4],referer: res[5],hash:res[6],imhuman:res[7]};
	    	validentries = true;
	    }
	    
	    if(!validentries)
	      	return null;
	    
	    // POST DATA COLLECTED
	    // WAIT 11 SECONDS
	    for (var i = 0; i < 12; i++) {
	    	showtime.notify("Waiting " + (11-i).toString() +" Seconds",1);
	        showtime.sleep(1);
	    }
	     
	    // POSTING DATA
	    var postresponse = showtime.httpReq(StreamSiteVideoLink, { postdata: postdata, method: "POST" });
		    	
    	var videopattern = new RegExp('file: "(.*?)",');
    	var res2 = videopattern.exec(postresponse.toString());
     	
    	return [StreamSiteVideoLink,res2[1]];
  }
 
  //returns list [link, filelink] or null if no valid link
  function resolveVivosx(StreamSiteVideoLink)
  {
	  	var postdata;
	  	var validentries = false;
	  	
	  	// get form
    	var getEmissionsResponse = showtime.httpGet(StreamSiteVideoLink);
    	
    	var dom = html.parse(getEmissionsResponse.toString());
		
    	try{
    		var hash = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[0].attributes.getNamedItem("value").value;
    		var timestamp = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[1].attributes.getNamedItem("value").value;
    	}catch(e)
    	{
    		// there was an error so no valid links?
    		return null
    	}
    	
	    postdata = {hash: hash, timestamp: timestamp};
	    
	    // POST DATA COLLECTED
	    // WAIT 8 SECONDS
	    for (var i = 0; i < 9; i++) {
	    	showtime.notify("Waiting " + (8-i).toString() +" Seconds",1);
	        showtime.sleep(1);
	    }
	     
	    // POSTING DATA
	    var postresponse = showtime.httpReq(StreamSiteVideoLink, { postdata: postdata, method: "POST" });
		    	
	    dom = html.parse(postresponse.toString());
	    var link = dom.root.getElementByClassName('stream-content')[0].attributes.getNamedItem("data-url").value;
	    // TODO: perhaps take the data-name attribute as first entry cause it shows the original filename
	    
    	return [StreamSiteVideoLink,link];
  }
 
  //returns list [link, filelink] or null if no valid link
  function resolveFlashxtv(StreamSiteVideoLink)
  {
	  	var postdata;
	    
	  	// Workaround to get the correct link if the file was uploaded to flashx.space instead of flash.tv
	  	// if the file is on flashx.tv, this should give an undefined as we do not have any redirects
	  	var spaceLink = showtime.httpReq(StreamSiteVideoLink, { noFollow:true,headRequest:true});
	    if (spaceLink["headers"]["Location"] != null)
	    	StreamSiteVideoLink = spaceLink["headers"]["Location"];
	    
    	var getEmissionsResponse = showtime.httpGet(StreamSiteVideoLink);
    	var dom = html.parse(getEmissionsResponse.toString());
    	var res = [];
    	
    	try
    	{
	    	res[1] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[0].attributes.getNamedItem("value").value;
	    	res[2] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[1].attributes.getNamedItem("value").value;
	    	res[3] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[2].attributes.getNamedItem("value").value;
	    	res[4] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[3].attributes.getNamedItem("value").value;
	    	res[5] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[4].attributes.getNamedItem("value").value;
	    	res[6] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[5].attributes.getNamedItem("value").value;
	    	res[7] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[6].attributes.getNamedItem("value").value;
    	}
    	catch(e)
    	{
    		// seems like the file is not available
    		return null
    	}

    	postdata = {op:res[1], usr_login:res[2], id: res[3],fname:res[4],referer: res[5],hash:res[6],imhuman:res[7]};
	    
	    // POST DATA COLLECTED
	    // WAIT 7 SECONDS
	    for (var i = 0; i < 8; i++) {
	    	showtime.notify("Waiting " + (7-i).toString() +" Seconds",1);
	        showtime.sleep(1);
	    }
	     
	    // POSTING DATA
	    var postresponse = showtime.httpReq(StreamSiteVideoLink, { postdata: postdata, method: "POST" });
	     
	    dom = html.parse(postresponse.toString());
	    
	    // put vid link together
	    // get cdn server number and luq4 hash
	    var cdn = dom.root.getElementById('vplayer').getElementByTagName("img")[0].attributes.getNamedItem("src").value;
	    cdn = /.*thumb\.(.*)\.fx.*/gi.exec(cdn)[1]    	    	   
	    // TODO: perhaps allow other quality settings -> here we always take normal
	    var luqhash = /normal\|luq(.*?)\|/gi.exec(postresponse.toString())[1];
	    var finallink = "http://play."+cdn+".fx.fastcontentdelivery.com/luq"+luqhash+"/normal.mp4";
    	
	    return [StreamSiteVideoLink,finallink];
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolvePowerwatchpw(StreamSiteVideoLink)
  {
	  	var postdata;
	  	
    	var getEmissionsResponse = showtime.httpGet(StreamSiteVideoLink);
    	var dom = html.parse(getEmissionsResponse.toString());
    	var res = [];
    	
    	try
    	{
	    	res[1] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[0].attributes.getNamedItem("value").value;
	    	res[2] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[1].attributes.getNamedItem("value").value;
	    	res[3] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[2].attributes.getNamedItem("value").value;
	    	res[4] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[3].attributes.getNamedItem("value").value;
	    	res[5] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[4].attributes.getNamedItem("value").value;
	    	res[6] = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[5].attributes.getNamedItem("value").value;
    	}
    	catch(e)
    	{
    		// seems like the file is not available
    		return null
    	}

    	postdata = {op:res[1], usr_login:res[2], id: res[3],fname:res[4],referer: res[5],hash:res[6]};
	    
	    // POST DATA COLLECTED
	    // WAIT 7 SECONDS
	    for (var i = 0; i < 8; i++) {
	    	showtime.notify("Waiting " + (7-i).toString() +" Seconds",1);
	        showtime.sleep(1);
	    }
	     
	    // POSTING DATA
	    var postresponse = showtime.httpReq(StreamSiteVideoLink, { postdata: postdata, method: "POST" });
	     
	    var finallink = /file:"(.*)",label/gi.exec(postresponse.toString())
	    
	    return [StreamSiteVideoLink,finallink[1]];
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolveCloudtimeto(StreamSiteVideoLink)
  {
	  	// This gets the mobile version of the video file (mp4)
	  	// due to bad performance this is not used
	  	/*var videohash= StreamSiteVideoLink.split("/");
	  	videohash = videohash[videohash.length-1];
  		getEmissionsResponse = showtime.httpGet("http://www.cloudtime.to/mobile/video.php?id="+videohash);
  	    var finallink = /<source src="(.*)" type="video\/mp4">/gi.exec(getEmissionsResponse.toString());
    	return [StreamSiteVideoLink,finallink[1]];*/
    	
    	// The Request needs to have specific parameters, otherwise the response object is the mobile version of the page
    	var getEmissionsResponse = showtime.httpReq(StreamSiteVideoLink,{noFollow:true,compression:true});
  		  	
    	try
    	{
	    	var cid = /flashvars.cid="(.*)";/gi.exec(getEmissionsResponse.toString())[1];
	    	var key = /flashvars.filekey="(.*)";/gi.exec(getEmissionsResponse.toString())[1];
	    	var file = /flashvars.file="(.*)";/gi.exec(getEmissionsResponse.toString())[1];
    	}catch(e)
    	{
    		return null;
    	}
    	
	    var postresponse = showtime.httpReq("http://www.cloudtime.to/api/player.api.php", {method: "GET" , args:{
	    	user:"undefined",
	    		cid3:"bs.to",
	    		pass:"undefined",
	    		cid:cid,
	    		cid2:"undefined",
	    		key:key,
	    		file:file,
	    		numOfErrors:"0"
	    }});
		    
	    var finallink = /url=(.*)&title/.exec(postresponse.toString());
	        	
    	return [StreamSiteVideoLink,finallink[1]];
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolveMovsharenet(StreamSiteVideoLink)
  {
	  	// OLD Resolver
	  	/*// it seems like the links to movshare miss the www
	  	// we add this here cause otherwise the request would fail due to noFollow 
	  	var correctedlink = StreamSiteVideoLink.replace("http://","http://www.");
	  	
	  	// The Request needs to have specific parameters, otherwise the response object is the mobile version of the page
    	var getEmissionsResponse = showtime.httpReq(correctedlink,{noFollow:true,compression:true});
    	try
    	{
	    	var cid = /flashvars.cid="(.*)";/gi.exec(getEmissionsResponse.toString())[1];
	    	var key = /flashvars.filekey="(.*)";/gi.exec(getEmissionsResponse.toString())[1];
	    	var file = /flashvars.file="(.*)";/gi.exec(getEmissionsResponse.toString())[1];
    	}catch(e)
    	{
    		return null;
    	}
    	
	    var postresponse = showtime.httpReq("http://www.movshare.net/api/player.api.php", {method: "GET" , args:{
	    	user:"undefined",
	    		cid3:"bs.to",
	    		pass:"undefined",
	    		cid:cid,
	    		cid2:"undefined",
	    		key:key,
	    		file:file,
	    		numOfErrors:"0"
	    }});
		    
	    var finallink = /url=(.*)&title/.exec(postresponse.toString());
	        	
    	return [StreamSiteVideoLink,finallink[1]];*/
		// it seems like the links to Movshare miss the www
	  	// we add this here cause otherwise the request would fail due to noFollow 
	  	var correctedlink = StreamSiteVideoLink.replace("http://","http://www.");
	  	var postdata;

	  	// The Request needs to have specific parameters, otherwise the response object is the mobile version of the page
	  	var getEmissionsResponse = showtime.httpReq(correctedlink,{noFollow:true,compression:true});
	  	
	  	var dom = html.parse(getEmissionsResponse.toString());
	  	var stepkey;
	  	
	  	try
	  	{
	  		stepkey = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[0].attributes.getNamedItem("value").value;
	  	}
	  	catch(e)
	  	{
	  		// seems like the file is not available
	  		return null
	  	}
	
	  	postdata = {stepkey:stepkey};
		     
		    // POSTING DATA
		    var postresponse = showtime.httpReq(correctedlink, {noFollow:true,compression:true,postdata: postdata, method: "POST" });
		    
		    try
	  	{
		    	var cid = /flashvars.cid="(.*)";/gi.exec(postresponse.toString())[1];
		    	var key = /flashvars.filekey="(.*)";/gi.exec(postresponse.toString())[1];
		    	var file = /flashvars.file="(.*)";/gi.exec(postresponse.toString())[1];
	  	}catch(e)
	  	{
	  		return null;
	  	}
	  	
		    var postresponse = showtime.httpReq("http://www.movshare.net/api/player.api.php", {method: "GET" , args:{
		    	user:"undefined",
		    		cid3:"bs.to",
		    		pass:"undefined",
		    		cid:cid,
		    		cid2:"undefined",
		    		key:key,
		    		file:file,
		    		numOfErrors:"0"
		    }});
			    
		    var finallink = /url=(.*)&title/.exec(postresponse.toString());
		        	
	  	return [StreamSiteVideoLink,finallink[1]];
	  
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolveNowvideoto(StreamSiteVideoLink)
  {
	  	// it seems like the links to nowvideo miss the www
	  	// we add this here cause otherwise the request would fail due to noFollow 
	  	var correctedlink = StreamSiteVideoLink.replace("http://","http://www.");
	  	var postdata;

	  	// The Request needs to have specific parameters, otherwise the response object is the mobile version of the page
    	var getEmissionsResponse = showtime.httpReq(correctedlink,{noFollow:true,compression:true});
    	
    	var dom = html.parse(getEmissionsResponse.toString());
    	var stepkey;
    	
    	try
    	{
    		stepkey = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[0].attributes.getNamedItem("value").value;
    	}
    	catch(e)
    	{
    		// seems like the file is not available
    		return null
    	}

    	postdata = {stepkey:stepkey};
	     
	    // POSTING DATA
	    var postresponse = showtime.httpReq(correctedlink, {noFollow:true,compression:true,postdata: postdata, method: "POST" });
	    
	    try
    	{
	    	var cid = /flashvars.cid="(.*)";/gi.exec(postresponse.toString())[1];
	    	var key = /var fkzd="(.*)";/gi.exec(postresponse.toString())[1];
	    	var file = /flashvars.file="(.*)";/gi.exec(postresponse.toString())[1];
    	}catch(e)
    	{
    		return null;
    	}
    	
	    var postresponse = showtime.httpReq("http://www.nowvideo.to/api/player.api.php", {method: "GET" , args:{
	    	user:"undefined",
	    		cid3:"bs.to",
	    		pass:"undefined",
	    		cid:cid,
	    		cid2:"undefined",
	    		key:key,
	    		file:file,
	    		numOfErrors:"0"
	    }});
		    
	    var finallink = /url=(.*)&title/.exec(postresponse.toString());
	        	
    	return [StreamSiteVideoLink,finallink[1]];
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolveVideoweedes(StreamSiteVideoLink)
  {
	  	// it seems like the links to videoweed miss the www
	  	// we add this here cause otherwise the request would fail due to noFollow
	  	var correctedlink = StreamSiteVideoLink.replace("http://","http://www.");
    	
	  	// The Request needs to have specific parameters, otherwise the response object is the mobile version of the page
    	var getEmissionsResponse = showtime.httpReq(correctedlink,{noFollow:true,compression:true});
    	
    	var dom = html.parse(getEmissionsResponse.toString());
    	var stepkey;
    	
    	try
    	{
    		stepkey = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[0].attributes.getNamedItem("value").value;
    	}
    	catch(e)
    	{
    		// seems like the file is not available
    		return null
    	}

    	postdata = {stepkey:stepkey};
	     
	    // POSTING DATA
	    var postresponse = showtime.httpReq(correctedlink, {noFollow:true,compression:true,postdata: postdata, method: "POST" });

    	try
    	{
	    	var cid = /flashvars.cid="(.*)";/gi.exec(postresponse.toString())[1];
	    	var key = /flashvars.filekey="(.*)";/gi.exec(postresponse.toString())[1];
	    	var file = /flashvars.file="(.*)";/gi.exec(postresponse.toString())[1];
    	}catch(e)
    	{
    		return null;
    	}
    	
	    var postresponse = showtime.httpReq("http://www.videoweed.es/api/player.api.php", {method: "GET" , args:{
	    	user:"undefined",
	    		cid3:"bs.to",
	    		pass:"undefined",
	    		cid:cid,
	    		cid2:"undefined",
	    		key:key,
	    		file:file,
	    		numOfErrors:"0"
	    }});
		    
	    var finallink = /url=(.*)&title/.exec(postresponse.toString());
	        	
    	return [StreamSiteVideoLink,finallink[1]];
  }
    
  //returns list [link, filelink] or null if no valid link
  function resolveYouwatchorg(StreamSiteVideoLink)
  {
	  	// TODO: Does not work because the streaming site uses iframes to integrate the videoplayer
	    // for some reason, the iframe link cannot be requested and leads to a http error -1 in movian
	  	var hash = StreamSiteVideoLink.split("/");
	  	hash = hash[hash.length -1];
    	
    	var getEmissionsResponse = showtime.httpReq("http://youwatch.org/embed-"+hash+".html",{noFollow:true,compression:true});
    	showtime.trace(getEmissionsResponse.toString());

    	var dom = html.parse(getEmissionsResponse.toString());
    	var link = dom.root.getElementByTagName("iframe")[0].attributes.getNamedItem("src").value;
    	var number = link.split("?")[1];
    	link = link.split("?")[0];

    	getEmissionsResponse = showtime.httpReq(link,{noFollow:true,compression:true});
    	showtime.trace(getEmissionsResponse.toString());
    	return null;
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolveNovamovcom(StreamSiteVideoLink)
  {
	  	// it seems like the links to novamov miss the www
	  	// we add this here cause otherwise the request would fail due to noFollow 
	  	var correctedlink = StreamSiteVideoLink.replace("http://","http://www.");
	  	var postdata;
    	var getEmissionsResponse = showtime.httpReq(correctedlink,{noFollow:true,compression:true});
    	
    	var dom = html.parse(getEmissionsResponse.toString());
    	var stepkey;
    	
    	try
    	{
    		stepkey = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[0].attributes.getNamedItem("value").value;
    	}
    	catch(e)
    	{
    		// seems like the file is not available
    		return null
    	}

    	postdata = {stepkey:stepkey};
	     
	    // POSTING DATA
	    var postresponse = showtime.httpReq(correctedlink, {noFollow:true,compression:true,postdata: postdata, method: "POST" });
	    
	    try
    	{
	    	var cid = /flashvars.cid="(.*)";/gi.exec(postresponse.toString())[1];
	    	var key = /flashvars.filekey="(.*)";/gi.exec(postresponse.toString())[1];
	    	var file = /flashvars.file="(.*)";/gi.exec(postresponse.toString())[1];
    	}catch(e)
    	{
    		return null;
    	}
    	
	    var postresponse = showtime.httpReq("http://www.novamov.com/api/player.api.php", {method: "GET" , args:{
	    	user:"undefined",
	    		cid3:"bs.to",
	    		pass:"undefined",
	    		cid:cid,
	    		cid2:"undefined",
	    		key:key,
	    		file:file,
	    		numOfErrors:"0"
	    }});
		    
	    var finallink = /url=(.*)&title/.exec(postresponse.toString());
	        	
    	return [StreamSiteVideoLink,finallink[1]];
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolveEcostreamtv(StreamSiteVideoLink)
  {
	  	var postdata;
    	var getEmissionsResponse = showtime.httpReq(StreamSiteVideoLink,{noFollow:true,compression:true});
    	var dom = html.parse(getEmissionsResponse.toString());
    	
    	var dataid= dom.root.getElementById('play').attributes.getNamedItem("data-id").value;
    	var footerhash = /var footerhash='(.*)';/gi.exec(getEmissionsResponse.toString())[1];
    	var superslots = /var superslots='(.*)';/gi.exec(getEmissionsResponse.toString())[1];
    	
    	postdata = {id:dataid,tpm:footerhash+superslots};

	    // POSTING DATA
    	// Important thing here: we need the header addition otherwise we get a 404
	    var postresponse = showtime.httpReq("http://www.ecostream.tv/xhr/videos/wOIriO01", {headers:{'X-Requested-With':'XMLHttpRequest'},compression:true,postdata: postdata, method: "POST" });
	    
	    // we are getting json back
	    var finallink = "http://www.ecostream.tv"+showtime.JSONDecode(postresponse.toString()).url;
	        	
    	return [StreamSiteVideoLink,finallink];
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolveSharedsx(StreamSiteVideoLink)
  {
	  	var postdata;
	  	
    	var getEmissionsResponse = showtime.httpGet(StreamSiteVideoLink);
    	var dom = html.parse(getEmissionsResponse.toString());
    	
    	try {
	    	var hash = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[0].attributes.getNamedItem("value").value;
		    var expires = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[1].attributes.getNamedItem("value").value;
		    var timestamp = dom.root.getElementByTagName('form')[0].getElementByTagName("input")[2].attributes.getNamedItem("value").value;
    	}catch(e)
	    {
	    	return null;
	    }
    	
    	postdata = {hash:hash,expires:expires, timestamp:timestamp};
	    
	    // POST DATA COLLECTED
	    // WAIT 12 SECONDS
	    for (var i = 0; i < 13; i++) {
	    	showtime.notify("Waiting " + (12-i).toString() +" Seconds",1);
	        showtime.sleep(1);
	    }
	     
	    // POSTING DATA
	    var postresponse = showtime.httpReq(StreamSiteVideoLink, { postdata: postdata, method: "POST" });
	    dom = html.parse(postresponse.toString());
	    
	    var finallink = dom.root.getElementByClassName('stream-content')[0].attributes.getNamedItem("data-url").value

    	return [StreamSiteVideoLink,finallink];
  }
  
  //returns list [link, filelink] or null if no valid link
  function resolveFilenukecom(StreamSiteVideoLink)
  {
    	var getEmissionsResponse = showtime.httpReq(StreamSiteVideoLink,{noFollow:true,compression:true});
    	var dom = html.parse(getEmissionsResponse.toString());
    	var link= dom.root.getElementById('go-next').attributes.getNamedItem("href").value;
    	var postresponse = showtime.httpReq("http://filenuke.com"+link, {noFollow:true,compression:true});
	    var finallink = /var lnk234 = '(.*)';/gi.exec(postresponse.toString())[1];
    	return [StreamSiteVideoLink,finallink];
  }
  
  // cine.to seems to only have lowercase hosters 
  var availableResolvers=["streamcloud","vivo", "flashx","powerwatch","cloudtime","movshare","nowvideo","videoweed","novamov","ecostream","shared","filenuke"];
  
  
  function resolveHoster(link, hostername)
  {
		var FinalLink;
		
		// Streamcloud.eu
		if(hostername == "streamcloud")
		{
			FinalLink = resolveStreamcloudeu(link);
		}
		// Vivo.sx
		if(hostername == "vivo")
		{
			FinalLink = resolveVivosx(link);
		}
		// FlashX.tv
		if(hostername == "flashx")
		{
			FinalLink = resolveFlashxtv(link);
		}
		// Powerwatch.pw
		if(hostername == "powerwatch")
		{
			FinalLink = resolvePowerwatchpw(link);
		}
		// Cloudtime.to
		if(hostername == "cloudtime")
		{
			FinalLink = resolveCloudtimeto(link);
		}
		// Movshare.net
		if(hostername == "movshare")
		{
			FinalLink = resolveMovsharenet(link);
		}
		// NowVideo.to
		if(hostername == "nowvideo")
		{
			FinalLink = resolveNowvideoto(link);
		}
		// VideoWeed.es
		if(hostername == "videoweed")
		{
			FinalLink = resolveVideoweedes(link);
		}
		// Novamov.com
		if(hostername == "novamov")
		{
			FinalLink = resolveNovamovcom(link);
		}
		// Ecostream.tv
		if(hostername == "ecostream")
		{
			FinalLink = resolveEcostreamtv(link);
		}
		// Shared.sx
		if(hostername == "shared")
		{
			FinalLink = resolveSharedsx(link);
		}
		// FileNuke.com
		if(hostername == "filenuke")
		{
			FinalLink = resolveFilenukecom(link);
		}
		
		return FinalLink;
  }
  
    
  // check if the resolver for the given hoster is implemented
  function checkResolver(hostername)
  {
	  if(availableResolvers.indexOf(hostername) > -1)
	  {
		  return " <font color=\"009933\">[Working]</font>";
	  }
	  else{
		  return " <font color=\"CC0000\">[Not Working]</font>";
	  }
  }
  
  
  // resolves the hoster link and gives the final link to the stream file
  plugin.addURI(PLUGIN_PREFIX + ":EpisodesHandler:(.*):(.*)", function(page,episodeLink, hostername){
	  	page.type = 'directory';
	  	// get the series title, season and episode number
		// seasonlink is serie/seriesname/seasonnumber/episodename
		page.metadata.title = hostername;
     	 var BrowseResponse = showtime.httpReq("https://cine.to/out/"+episodeLink,{
			  //compression: true,
			  noFollow:true,
			  headRequest:true,
			  debug:true
			});
		
     	showtime.trace(showtime.JSONEncode(BrowseResponse.headers));
     	showtime.trace(showtime.JSONEncode(BrowseResponse.multiheaders));
		
		//showtime.trace(Object.keys(BrowseResponse["headers"]));
		//showtime.trace(BrowseResponse.toString());
		showtime.trace(showtime.JSONEncode(BrowseResponse["headers"]["Location"]));
		 
		var directlink = BrowseResponse["headers"]["Location"];

		var vidlink = resolveHoster(directlink, hostername)
		if(vidlink == null)
    		page.appendPassiveItem('video', '', { title: "File is not available"  });
		else
		page.appendItem(vidlink[1], 'video', { title: vidlink[0] });
  });
  
  
  
  
  plugin.addURI(PLUGIN_PREFIX + ":MovieStreamSelection:(.*):(.*):(.*):(.*)", function(page,ID,langtag,title,hostername){
	  page.type = 'directory';

		page.metadata.title = "Links of "+hostername+" for movie " + decodeURIComponent(title);

		 var BrowseResponse = showtime.httpReq("http://cine.to/request/links",{
			  compression: true,
			  noFollow:false,
			  method: "POST" ,
			  postdata: "ID="+ID+"&lang="+langtag,
			  headers: {"Content-Type": "application/x-www-form-urlencoded"} 
		  	// this header is important because the postdata as string results in ascii and not form urlencoded content type
			});
		 
		 
		 answer=showtime.JSONDecode(BrowseResponse.toString());
		 for(var k=1; k< answer.links[hostername].length; k++)
		  {
			  var item = page.appendItem(PLUGIN_PREFIX + ':EpisodesHandler:'+answer.links[hostername][k]+":"+hostername , 'video', { 
				
				  title: hostername+ " " + k
				 
				  }
			  );
		  }
  });

  plugin.addURI(PLUGIN_PREFIX + ":MovieHosters:(.*):(.*):(.*)", function(page,ID,langtag,title){
	  page.type = 'directory';

	  page.metadata.title = "Hoster selection: "+decodeURIComponent(title); 

	  var BrowseResponse = showtime.httpReq("http://cine.to/request/links",{
		  compression: true,
		  noFollow:false,
		  method: "POST" ,
		  postdata: "ID="+ID+"&lang="+langtag,
		  headers: {"Content-Type": "application/x-www-form-urlencoded"} 
	  	// this header is important because the postdata as string results in ascii and not form urlencoded content type
		});
  	
	answer=showtime.JSONDecode(BrowseResponse.toString());
	  	
	// list of hosters
	
	for(var key in answer.links) {
  	   
		  var item = page.appendItem(PLUGIN_PREFIX + ':MovieStreamSelection:'+ID+":"+langtag+":"+title+":"+key, 'video', { 
			  title: new showtime.RichText(key + " " + checkResolver(key)),
			  }
		  );
	  }
    
  });
  
  // Movie Entry handler
  // (separate languages)
  // http://cine.to/request/entry
  plugin.addURI(PLUGIN_PREFIX + ':MovieLanguageSelection:(.*)', function(page, ID) {
	  	page.loading = false;
	  	page.type = 'directory';
	 	
		  var BrowseResponse = showtime.httpReq("http://cine.to/request/entry",{
			  compression: true,
			  noFollow:false,
			  method: "POST" ,
			  postdata: "ID="+ID,
			  headers: {"Content-Type": "application/x-www-form-urlencoded"} 
		  	// this header is important because the postdata as string results in ascii and not form urlencoded content type
			});
	  	
		answer=showtime.JSONDecode(BrowseResponse.toString());
	  	page.metadata.title = "Language Selection: "+answer.entry.title;
	  	
	  	for(var key in answer.entry.lang) {
	  	    var value = answer.entry.lang[key];
	  		  
			  var item = page.appendItem(PLUGIN_PREFIX + ':MovieHosters:'+ID+":"+key+":"+encodeURIComponent(answer.entry.title), 'video', { 
				  title: value,
				  }
			  );
		  }
	    
		page.loading = false;
	});
  
  
  function pad(n, width, z) {
	  z = z || '0';
	  n = n + '';
	  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}
  
  
  // page for browsing results with paging
  // this handles all requests (browse and search)
  // differences are made through parameters
  plugin.addURI(PLUGIN_PREFIX+ ":MoviesPaging:(.*):(.*):(.*)", function(page,genre,term,currentpage) {
	  page.type="directory";
	  
	  var postterm =  term;
	  // necessary to include empty search criteria cause otherwise the pattern for this page does not match
	  if(term==="NoSearchCriteriaEntered")
		  postterm =  "";
		  
	 
	  var noEntry = true;
	  
	  // search params
	  // kind,genre,rating,year[],year[],term,page,count
	  // TODO: due to the fact that we ignore filters right now we fill up with fixed vals
	  //var data = {kind:"all",genre:"0",rating:"1","year[]":"1913","year[]":"2016",term:res.input,page:"1",count:"23"};
	  //var data = {kind:"all",genre:"0",rating:"1",year:["1913","2016"],term:res.input,page:"1",count:"23"};
	  // The double year[] param is a problem if we use a data dictionary.
	  // to come around this we use postdata string
	  var BrowseResponse = showtime.httpReq("http://cine.to/request/search",{
		  compression: true,
		  noFollow:false,
		  method: "POST",
		  postdata: "kind=all&term="+postterm+"&year%5B%5D=1913&year%5B%5D=2016&count=23&genre="+genre+"&rating=1&page="+currentpage,
		  headers: {"Content-Type": "application/x-www-form-urlencoded"} 
	  	// this header is important because the postdata as string results in ascii and not form urlencoded content type
		});

	  var answer=showtime.JSONDecode(BrowseResponse.toString());	 

	  // browse by genre page
	  if(genre != 0)
		  page.metadata.title = "Browse movies in genre: "+ Genres[genre] + " Page "+currentpage+" / "+answer.pages ;
	  else
		  page.metadata.title = "Search for movies / actors containing: "+ decodeURIComponent(postterm) + " Page "+currentpage+" / "+answer.pages ;
	  
	  
	  // we perhaps have a paging entry
	  if(answer.current>1)
	  {
		  var path = PLUGIN_PREFIX + ':MoviesPaging:' + genre + ":" + term + ":" + (parseInt(currentpage)-1).toString();
		  var entry = new showtime.RichText( "<font color=\"ff5600\">[Previous Page]</font>");

		  var item = page.appendItem( path, 'video', { 
			  	title: entry 
		  });

	  }
	  
	  for(var k=0; k < answer.entries.length; k++)
	  {
		  // year,title,imdb,icon, description
		  var item = page.appendItem(PLUGIN_PREFIX + ':MovieLanguageSelection:'+ pad(answer.entries[k].imdb,7,0) , 'video', { 
			  // imdb always have 7 digits
			  imdb: pad(answer.entries[k].imdb,7,0) ,
			  year: answer.entries[k].year,
			  title: answer.entries[k].title,
			  icon: "http:"+answer.entries[k].cover,
			  description: "Languages: "+ answer.entries[k].language
			  }
		  );
		  noEntry=false;
	  }
	  		  
	  if(noEntry == true)
		  page.appendPassiveItem('video', '', { title: 'The search gave no results' });
	  else
	  {
		  // we perhaps have a paging entry
		  if(!(answer.current >= answer.pages))
		  {

			  var item = page.appendItem(PLUGIN_PREFIX + ':MoviesPaging:'+ genre+":"+term+":"+(parseInt(currentpage)+1).toString(), 'video', { 
				  title: new showtime.RichText( "<font color=\"009933\">[Next Page]</font>")
				  });
		  }  
	  }
	  
	page.loading = false;

  });
  
  var Genres= ["All", "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
     		  "Documentary", "Drama", "Family", "Fantasy", "Film-Noir", "History", "Horror", "Music", "Musical", "Mystery",
     		  "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western"];
  
  // Search param indicates the search criteria
  plugin.addURI(PLUGIN_PREFIX+":GenreList", function(page) {
	  page.type="directory";
	  page.metadata.title = "Which movie genre you want to browse?";

	  for(var k=0; k < Genres.length; k++)
	  {
		  var item = page.appendItem(PLUGIN_PREFIX + ':MoviesPaging:'+ k + ":NoSearchCriteriaEntered:1", 'video', { 
			  title: Genres[k]
			  }
		  );
	  }
  });
  
  // Search param indicates the search criteria
  plugin.addURI(PLUGIN_PREFIX+":Search", function(page) {
	  page.type="directory";
  
	  var res = showtime.textDialog("What movies / actors do you want to search for?", true,true);
	  
	  // check for user abort
	  if(res.rejected)
		  page.redirect(PLUGIN_PREFIX+"start");
	  else
	  {
		  var searchcriteria = res.input == "" ? "NoSearchCriteriaEntered" : res.input  
		  page.redirect(PLUGIN_PREFIX+":MoviesPaging:0:"+encodeURIComponent(searchcriteria)+":1");
	  }
  });
  
  // Register a service (will appear on home page)
  var service = plugin.createService("cine.to", PLUGIN_PREFIX+"start", "video", true, plugin.path + "cine.png");
  
  // Register Start Page
  plugin.addURI(PLUGIN_PREFIX+"start", function(page) {
    page.type = "directory";
    page.metadata.title = "cine.to Main Menu";
    page.appendItem(PLUGIN_PREFIX + ':GenreList', 'directory',{title: "Browse (by Genre)"});
    page.appendItem(PLUGIN_PREFIX + ':Search','item',{ title: "Search...", });
	page.loading = false;
  });

})(this);