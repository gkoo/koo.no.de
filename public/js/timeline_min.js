var onLinkedInLoad;$(function(){var u,P,E,b,j,q=new Date(),W=q.getMonth()+1,c=q.getFullYear(),t=0,y=[],L=-1,g={},p=[],R=0,S=0,A=100,f=$(".pics"),V=$("#loading"),G=$("#timeline"),U=$("#mypic"),d=$("#message"),B=$("#playBtn"),C=$("#speed"),O=$("#signin"),m=$("#logo img"),o=$("#timelineStuff"),H=G.children(".top.block"),k=G.children(".bottom.block"),M=0,x=0,J=0,r=0,e=80,F=80,D=1,h=290,Q=126,T=970,I=140,v=20,a=20,K=315,n=v,w=v+T-F-D*2,z=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],s=["orange","blue","green","purple","teal","red","yellow","magenta","grey"],N=/[^\w\s]/gi,l;convertDateToVal=function(X){if(!X){return 0}return(X.year-1900)*12+X.month},convertPxToPct=function(X){if(X<v){X=v}else{if(X>v+T){X=v+T}}return X/T*100},myCareerNow=convertDateToVal({month:W,year:c}),showErrorMsg=function(ab,Z,Y,X){var aa;o.fadeTo("slow",0);o.hide();O.fadeTo("slow",0);O.hide();V.fadeTo("slow",0);V.hide();if(!ab){ab="Whoops... we broke something.";Z="In the mean time, ";Y="check out LinkedIn Today!";X="http://www.linkedin.com/today/"}aa=$("<a/>").attr("href",X).text(Y);d.append($("<p/>").text(ab)).append($("<p/>").text(Z).append(aa));d.show();d.fadeTo("slow",1)},isSameCompanies=function(ac,X){var Z,Y,aa,ab=ac.length,ad=X.length;if(ab!==ad){return false}for(Z=0;Z<ab;++Z){aa=false;for(Y=0;Y<ad;++Y){aa=ac[Z].name===X[Y].name&&convertDateToVal(ac[Z].startDate)===convertDateToVal(X[Y].startDate)&&convertDateToVal(ac[Z].endDate)===convertDateToVal(X[Y].endDate);if(aa){break}}if(!aa){return false}}return true},hidePic=function(X){X.removeClass("picShowing").removeClass("picToShow").removeClass("picToHide");if(X.hasClass("upper")){X.animate({top:K+F+"px"})}else{X.animate({top:F*(-1.5)+"px"})}},hidePics=function(){f.children(".picShowing").each(function(){var X=$(this);if(!X.hasClass("picToShow")){hidePic(X)}})},hideMarkedPics=function(){f.children(".picToHide").each(function(){hidePic($(this))})},showPics=function(){f.children(".picToShow").each(function(){var X=$(this);X.removeClass("picToShow");if(!X.hasClass("picShowing")){X.addClass("picShowing").animate({top:X.attr("li-top")+"px"},{queue:false})}})},isConcurrentEmployee=function(ac){var Y,ab,X,Z=ac.length,aa=Math.floor(t);for(Y=0;Y<Z;++Y){cxnDate=ac[Y].split(":");ab=parseInt(cxnDate[0],10);X=parseInt(cxnDate[1],10);if((ab&&(ab<aa||ab==aa))&&(!X||(X>aa||X==aa))){return true}}return false},showExistingPictures=function(Z,Y){var aa,X,ab;if(!Z){return}ab=Z[L];for(id in Z){if(id!==L){aa=$("#"+id);if(aa){X=isConcurrentEmployee(Z[id]);if(aa&&X&&!aa.hasClass("picToShow")){aa.addClass("picToShow");aa.removeClass("picToHide")}else{if(aa&&aa.hasClass("picShowing")&&!X&&!aa.hasClass("picToShow")){aa.addClass("picToHide")}}}}}},updateCurrCompanies=function(Y){var Z,X,ab,ac,aa=y.length;$(".infoBlock").css("opacity",0);for(i=0;i<aa;++i){ab=y[i];X=ab.unformattedName;if(j[X]){showExistingPictures(j[X],Y)}ac=convertDateToVal(y[i].startDate);Z=[y[i].name.toLowerCase(),ac].join("").replace(/\s/g,"").replace(N,"");$("."+Z).css("opacity",1)}hidePics();showPics()},doDrag=function(Z){var ae,ac,ab,ag,X,af,ah,ad,aa,ai,Y;ae=(Z-n)/(w-n);Y=(A-S)/100;ae=ae*Y+S/100;ac=(E*ae)+P;t=ac;ah=y;y=[];ad=p.length;for(ab=0;ab<ad;++ab){ag=p[ab];X=convertDateToVal(ag.startDate);af=convertDateToVal(ag.endDate);if(X&&X<ac&&(!af||af>ac)){if(ag.name){y.push(ag)}}}aa=y.length;if(aa&&!isSameCompanies(ah,y)){updateCurrCompanies(t)}else{if(aa){for(ab=0;ab<aa;++ab){ai=j[y[ab].unformattedName];if(ai){showExistingPictures(ai,t)}}showPics();hideMarkedPics()}}if(!aa){$(".infoBlock").css("opacity",0);hidePics()}},doDragWrapper=function(X,Y){U.stop(true);B.text("Play");doDrag(Y.position.left)},convertDateToVal=function(X){if(!X){return 0}if(!X.month){X.month=1}return X?(X.year-1900)*12+X.month:0},datesOverlap=function(aa,Y,Z,X){if(!aa||!Z){return false}if(Y&&X){return(Y>Z&&aa<X)}if((!Y&&!X)||(Y==0&&X==0)){return true}if(!Y){return aa<X}return Z<Y},timelineHasRoom=function(Z,X,ac){var aa,Y,ab=Z.length;if(Z&&!ab){return 1}for(Y=0;Y<ab;++Y){aa=Z[Y].split(":");if(datesOverlap(aa[0],aa[1],X,ac)){return false}}return true},addBlockToTimeline=function(aa,Y,X,Z){if(Z==="top"){H.append(aa);G.children(".top.date").append(Y);G.children(".top.info").append(X)}else{k.append(aa);G.children(".bottom.date").append(Y);G.children(".bottom.info").append(X)}},createTimelineBlock=function(ac,ae,Y,aa){var X,af,ah,ak,aj,ab,am,ai,ag,ad,Z,al="";X=convertDateToVal(ac.startDate);af=ac.endDate?convertDateToVal(ac.endDate):myCareerNow;width=(af-X)/E*100+"%";am=Math.floor((X-P)/E*100);Z=(X-P)/E*100+"%";ab=s[ae%s.length];if(ac.endDate){al=" - "+z[ac.endDate.month-1]+" "+ac.endDate.year}ai="("+z[ac.startDate.month-1]+" "+ac.startDate.year+al+")";ah=$("<div/>").attr("data-li-left",Z).attr("data-li-width",width).addClass(ab+" tlBlock").css({height:"100%",width:width,left:Z,"z-index":am,position:"absolute","border-left":"1px solid #fff"});ak=$("<span/>").text(z[ac.startDate.month-1]+" "+ac.startDate.year).css({position:"absolute","z-index":am,left:Z}).attr("data-li-left",Z).attr("data-li-zindex",am);aj=$("<span/>").css({left:Z,"z-index":am}).attr("data-li-left",Z).attr("data-li-zindex",am).addClass("infoBlock").addClass([ac.company.name.toLowerCase(),X].join("").replace(/\s/g,"").replace(N,"")).append($("<span/>").addClass("compName").text(ac.company.name)).append($("<span/>").addClass("compDate").text(ai));ag=timelineHasRoom(Y,X,af);ad=timelineHasRoom(aa,X,af);if((ag&&ad)||(!ag&&!ad)){if(ae%2){addBlockToTimeline(ah,ak,aj,"top");Y.push(X+":"+af)}else{addBlockToTimeline(ah,ak,aj,"bottom");aa.push(X+":"+af)}}else{if(ag){addBlockToTimeline(ah,ak,aj,"top");Y.push(X+":"+af)}else{if(ad){addBlockToTimeline(ah,ak,aj,"bottom");aa.push(X+":"+af)}}}},handleOwnPositions=function(Z){var aa,X,Y,ab,ae=[],ad=[],ac=Z.length;G.hide();P=convertDateToVal(Z[0].startDate);for(aa=0;aa<ac;++aa){X=Z[aa];Y=X.company;if(Y&&Y.name){p.push({id:Y.id,name:Y.name,unformattedName:Y.name.toLowerCase().replace(N,""),startDate:X.startDate,endDate:X.endDate});ab=convertDateToVal(X.startDate);if(ab<P){P=ab}}}E=myCareerNow-P;for(aa=0;aa<ac;++aa){createTimelineBlock(Z[aa],aa,ae,ad)}G.show()},addEducationToPositions=function(ab){var aa,Z,ae,ad,X,ac,Y;if(ab.educations&&ab.educations.values){ae=ab.educations.values;ac=ae.length;for(aa=0;aa<ac;++aa){ad=ae[aa];if(ad.startDate){X={company:{name:ad.schoolName},startDate:ad.startDate,endDate:ad.endDate};if(ab.positions&&ab.positions.values){Y=ab.positions.values.length;for(Z=Y-1;Z>=0;--Z){if(ab.positions.values[Z].endDate&&(convertDateToVal(ab.positions.values[Z].endDate)>convertDateToVal(ad.endDate))){ab.positions.values.splice(Z+1,0,X);break}else{if(Z===0){ab.positions.values.splice(0,0,X)}}}++ab.positions._total}else{if(!ab.positions){ab.positions={}}ab.positions._total=1;ab.positions.values=[X]}}}}};handleOwnProfile=function(Y){var X;if(!Y){return showErrorMsg()}if(!M){u=Y;return}if(!Y.positions._total){showErrorMsg("You don't have any companies listed.","Why not ","add some now?","http://www.linkedin.com/profile/edit?trk=li_timeline");return}addEducationToPositions(Y);b.send({type:"storeOwnProfile",profile:Y});L=Y.id;if(!Y.pictureUrl){Y.pictureUrl="/img/icon_no_photo_80x80.png"}X=$("#mypic").attr("src",Y.pictureUrl).fadeTo("fast",1);G.fadeTo("fast",1);U.css("top",(I-F)/2-D);if(Y.positions&&Y.positions.values){handleOwnPositions(Y.positions.values)}},createEmployDates=function(ac){var ad,Y,ae,Z,ab,aa,X={};if(!ac.positions||!ac.positions.values){return}ab=ac.positions.values.length;for(aa=0;aa<ac.positions.values.length;++aa){Y=ac.positions.values[aa];ae=convertDateToVal(Y.startDate);Z=convertDateToVal(Y.endDate);ad=Y.company.name?Y.company.name.toLowerCase().replace(N,""):"";if(ad){if(X[ad]){X[ad].push(ae+":"+Z)}else{if(ad){X[ad]=[ae+":"+Z]}}}}return X},storeConnection=function(Y){var X={};X.id=Y.id;X.pictureUrl=Y.pictureUrl;X.publicProfileUrl=Y.publicProfileUrl;X.fullName=Y.firstName+" "+Y.lastName;X.employmentDates=createEmployDates(Y);g[Y.id]=X},createCxnPic=function(Y){var aa,ab,Z,X;aa=Math.floor(Math.random()*20)-10;if(!Y.publicProfileUrl){Y.publicProfileUrl="#"}X=$("<a/>").attr("href",Y.publicProfileUrl).attr("title",Y.firstName+" "+Y.lastName).attr("id",Y.id).attr("target","_new").css({"-moz-transform":"rotate("+aa+"deg)","-webkit-transform":"rotate("+aa+"deg)",transform:"rotate("+aa+"deg)",position:"absolute","background-image":"url("+Y.pictureUrl+")"}).addClass("cxnPic");X.hover(function(){$(this).css("z-index",1000)},function(){$(this).css("z-index","")});if(Math.floor(Math.random()*2)){if(Math.floor(Math.random()*4)){Z=Math.floor(Math.random()*(w-h))+h;ab=Math.floor(Math.random()*(K-F-30))+10}else{Z=Math.floor(Math.random()*(h));ab=Math.floor(Math.random()*(K-Q-F*5/4-30))+(Q+a)}X.addClass("upper").css({top:K+F,left:Z}).attr("li-top",ab);$("#upper .pics").append(X)}else{Z=Math.floor(Math.random()*w);ab=Math.floor(Math.random()*(K-F-20))+10;X.addClass("lower").css({left:Z,top:F*(-1.5)}).attr("li-top",ab);$("#lower .pics").append(X.addClass("lower"))}if(Y.id==="8Hnjm5JwNG"){X.click(function(ac){var ad=$("#gk");ac.preventDefault();if(!ad.length){ad=$("<img>").attr("id","gk").attr("src","/img/gk.jpg");$("body").append(ad);ad.load(doGKAnimate)}else{ad.css("left","-650px");doGKAnimate()}})}},handleConnections=function(X){var Y,Z,aa;J=1;if(!x){g=X;return}if(!X.values||!X._total){showErrorMsg("It doesn't look like you have any connections yet.","Here are some ","people you may know.","http://www.linkedin.com/pymk-results");return}Z=X.values.length;for(Y=0;Y<Z;++Y){aa=X.values[Y];if(aa.id!==L&&aa.pictureUrl){storeConnection(aa);if(!$("#"+aa.id).length){createCxnPic(aa)}addEducationToPositions(aa)}else{}}b.send({type:"filterConnections",profiles:X,sessionId:R})},doGKAnimate=function(){var X=$("#gk");X.css("left","-650px").show();X.animate({left:$(window).width()},{complete:function(){X.hide()}})},doPlay=function(){var Z,ab,aa,Y,X={slow:25000,med:12000,fast:6000,realfast:2000};$(this).text("Pause");myPicLeft=U.position().left;aa=C.children(".active");Y=aa.attr("class").replace(/\s?active\s?/,"");ab=X[Y];Z=(w-myPicLeft)*ab/w;U.animate({left:w+"px"},{duration:Z,easing:"linear",step:function(ac,ad){doDrag(ac)},complete:function(){B.text("Play")}})},doPause=function(){$(this).text("Play");U.stop(stop)},fixOverflow=function(){var aa=$(this),Y=aa.width(),Z=aa.attr("data-li-left"),X;if(Y+aa.position().left>T){X=(T-Y)/T*100+"%";aa.css("left",X).attr("data-li-rawleft",Z).attr("data-li-left",X)}},onLinkedInAuth=function(){O.fadeTo("fast",0);O.hide();V.show();V.fadeTo("slow",1);m.show();m.fadeTo("slow",1);IN.API.Raw("/people/~:(id,first-name,last-name,positions,picture-url,educations)").result(handleOwnProfile);IN.API.Raw("/people/~/connections:(id,first-name,last-name,positions,picture-url,public-profile-url,educations)").result(handleConnections)};onLinkedInLoad=function(){V.fadeTo("slow",0,function(){V.children("p:nth-child(1)").text("Loading connections...")});V.hide();O.show();O.fadeTo("slow",1);IN.Event.on(IN,"auth",onLinkedInAuth)};b=new io.Socket(null,{port:e,rememberTransport:false});b.connect();b.on("connect",function(){M=1;if(u&&!x){handleOwnProfile(u)}});b.on("message",function(X){if(X.type!=="undefined"){if(X.type==="storeOwnProfileComplete"){R=X.sessionId;x=1;if(J){handleConnections(g)}}else{if(X.type==="filterConnectionsResult"){r=1;j=X.coworkers;V.fadeTo("fast",0);V.hide();o.show();l=G.offset().top;$("#timeline .date span").each(fixOverflow);$(".infoBlock").each(fixOverflow);o.fadeTo("slow",1)}}}});B.click(function(X){X.preventDefault();if($(this).text()==="Play"){doPlay.apply(this)}else{doPause.apply(this)}});C.children().click(function(X){var Y=$(this);if(Y.hasClass("active")){return X.preventDefault()}C.children(".hide").removeClass("hide");C.children(".active").removeClass().addClass(Y.attr("class")+" active");C.find(".active a").text(Y.text());Y.addClass("hide");C.removeClass("hover");X.preventDefault()}),C.hover(function(){C.addClass("hover")},function(){C.removeClass("hover")});U.draggable({axis:"x",drag:doDragWrapper,containment:"parent"});$("#printCoworkers").click(function(){console.log(j)});$("#printCurrCompBtn").click(function(){console.log(y)});$("#printCompBtn").click(function(){console.log(p)});setTimeout(function(){var X=V.find(".helpReload");if(!r){X.show().click(function(Y){window.location.reload();Y.preventDefault()})}},45000);document.getElementById("mypic").ontouchmove=function(X){var aa,Z,Y;X.preventDefault();if(X.touches&&X.touches.length===1){aa=X.touches[0];Z=aa.pageX-$("#body").position().left;Y=Z-F/2-D;if(Y>=n&&Y<=w){U.css("left",Y+"px");doDrag(Y)}}};document.getElementById("speed").ontouchstart(function(){if(C.hasClass("hover")){C.removeClass("hover")}else{C.addClass("hover")}})});