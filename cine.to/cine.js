/**
 * Movian plugin to watch cine.to streams 
 *
 * Copyright (C) 2015-2017 BuXXe
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
   var resolvers = require('./libs/hoster-resolution-library/hrl');

(function(plugin) {

  var PLUGIN_PREFIX = "cine.to:";
  
  // resolves the hoster link and gives the final link to the stream file
  plugin.addURI(PLUGIN_PREFIX + ":EpisodesHandler:(.*):(.*)", function(page,episodeLink, hostername){
		page.metadata.icon = Plugin.path + 'cine.png';
		page.type = 'directory';
	  	// get the series title, season and episode number
		// seasonlink is serie/seriesname/seasonnumber/episodename
		page.metadata.title = hostername;
     	 var BrowseResponse = showtime.httpReq("https://cine.to/out/"+episodeLink,{
			  //compression: true,
			  noFollow:true,
			  headRequest:true,
			});
		 
		var directlink = BrowseResponse["headers"]["Location"];

		var vidlink = resolvers.resolve(directlink, hostername)
		if(vidlink == null)
    		page.appendPassiveItem('video', '', { title: "File is not available"  });
		else
		page.appendItem(vidlink[1], 'video', { title: vidlink[0] });
  });
  
  
  
  
  plugin.addURI(PLUGIN_PREFIX + ":MovieStreamSelection:(.*):(.*):(.*):(.*)", function(page,ID,langtag,title,hostername){
	  page.type = 'directory';
	  page.metadata.icon = Plugin.path + 'cine.png';

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
	  page.metadata.icon = Plugin.path + 'cine.png';

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
	
	for(var hostname in answer.links) 
	{
   
		var resolverstatus = resolvers.check(hostname);
		var statusmessage = resolverstatus ? " <font color=\"009933\">[Working]</font>":" <font color=\"CC0000\">[Not Working]</font>";
		
		var item = page.appendItem(PLUGIN_PREFIX + ':MovieStreamSelection:'+ID+":"+langtag+":"+title+":"+hostname, 'video', { 
			  title: new showtime.RichText(hostname + " " + statusmessage),
			});
	}
    
  });
  
  // Movie Entry handler
  // (separate languages)
  // http://cine.to/request/entry
  plugin.addURI(PLUGIN_PREFIX + ':MovieLanguageSelection:(.*)', function(page, ID) {
		page.metadata.icon = Plugin.path + 'cine.png';
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
	  page.metadata.icon = Plugin.path + 'cine.png';

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
		  postdata: "kind=all&term="+postterm+"&year%5B%5D=1913&year%5B%5D=2017&count=23&genre="+genre+"&rating=1&page="+currentpage,
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
	  page.metadata.icon = Plugin.path + 'cine.png';

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
	  page.metadata.icon = Plugin.path + 'cine.png';

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
	page.metadata.icon = Plugin.path + 'cine.png';
	page.type = "directory";
    page.metadata.title = "cine.to Main Menu";
    page.appendItem(PLUGIN_PREFIX + ':GenreList', 'directory',{title: "Browse (by Genre)"});
    page.appendItem(PLUGIN_PREFIX + ':Search','item',{ title: "Search...", });
	page.loading = false;
  });

})(this);