//UDMv3.5
//**DO NOT EDIT THIS *****
if (!exclude) { //********
//************************



///////////////////////////////////////////////////////////////////////////
//
//  ULTIMATE DROPDOWN MENU VERSION 3.5 by Brothercake
//  This is a special version for Dynamic Drive (http://www.dynamicdrive.com)
//
//  Link-wrapping routine by Brendan Armstrong
//  Original KDE modifications by David Joham
//  Opera reload/resize based on a routine by Michael Wallner
//  Select-element hiding routine by Huy Do
//
///////////////////////////////////////////////////////////////////////////



// *** POSITIONING AND STYLES *********************************************



var menuALIGN = "left";		// alignment
var absLEFT = 	230;		// absolute left or right position (if menu is left or right aligned)
var absTOP = 	132; 		// absolute top position

var staticMENU = false;		// static positioning mode (ie5,ie6 and ns4 only)

var stretchMENU = false;		// show empty cells
var showBORDERS = false;		// show empty cell borders

var baseHREF = "";	// base path to .js files for the script (ie: resources/)
var zORDER = 	1000;		// base z-order of nav structure (not ns4)

var mCOLOR = 	"#FFFFFF";	// main nav cell color
var rCOLOR = 	"#388b8c";	// main nav cell rollover color
var bSIZE = 	1;		// main nav border size
var bCOLOR = 	"black"	// main nav border color
var aLINK = 	"black";	// main nav link color
var aHOVER = 	"";		// main nav link hover-color (dual purpose)
var aDEC = 	"none";		// main nav link decoration
var fFONT = 	"arial";	// main nav font face
var fSIZE = 	12;		// main nav font size (pixels)
var fWEIGHT = 	"bold"		// main nav font weight
var tINDENT = 	5;		// main nav text indent (if text is left or right aligned)
var vPADDING =  5;		// main nav vertical cell padding
var vtOFFSET = 	0;		// main nav vertical text offset (+/- pixels from middle)

var keepLIT =	true;		// keep rollover color when browsing menu
var vOFFSET = 	5;		// shift the submenus vertically
var hOFFSET = 	4;		// shift the submenus horizontally

var smCOLOR = 	"#ffffff";	// submenu cell color

var srCOLOR = 	"#5bbfc0";	// submenu cell rollover color
var sbSIZE = 	1;		// submenu border size
var sbCOLOR = 	"black"	// submenu border color
var saLINK = 	"black";	// submenu link color
var saHOVER = 	"";		// submenu link hover-color (dual purpose)
var saDEC = 	"none";		// submenu link decoration
var sfFONT = 	"verdana";// submenu font face
var sfSIZE = 	12;		// submenu font size (pixels)
var sfWEIGHT = 	"normal"	// submenu font weight
var stINDENT = 	5;		// submenu text indent (if text is left or right aligned)
var svPADDING = 1;		// submenu vertical cell padding
var svtOFFSET = 0;		// submenu vertical text offset (+/- pixels from middle)

var shSIZE =	2;		// submenu drop shadow size
var shCOLOR =	"#cccccc";	// submenu drop shadow color
var shOPACITY = 75;		// submenu drop shadow opacity (not ie4,ns4 or opera)

var keepSubLIT = true;		// keep submenu rollover color when browsing child menu
var chvOFFSET = -12;		// shift the child menus vertically
var chhOFFSET = 7;		// shift the child menus horizontally

var openTIMER = 10;		// [** new **] menu opening delay time (not ns4/op5/op6)
var openChildTIMER = 20;	// [** new **] child-menu opening delay time (not ns4/op5/op6)
var closeTIMER = 330;		// menu closing delay time

var cellCLICK = true;		// links activate on TD click
var aCURSOR = "hand";		// cursor for active links (not ns4 or opera)

var altDISPLAY = "";		// where to display alt text
var allowRESIZE = mu;		// allow resize/reload

var redGRID = false;		// show a red grid
var gridWIDTH = 760;		// override grid width
var gridHEIGHT = 500;		// override grid height
var documentWIDTH = 0;		// override document width

var hideSELECT = false;		// auto-hide select boxes when menus open (ie only)
var allowForSCALING = false;	// allow for text scaling in gecko browsers
var allowPRINTING = false;	// allow the navbar and menus to print (not ns4)

var arrWIDTH = 13;		// [** new **] arrow width (not ns4/op5/op6)
var arrHEIGHT = 13;		// [** new **] arrow height (not ns4/op5/op6)

var arrHOFFSET = -1;		// [** new **] arrow horizontal offset (not ns4/op5/op6)
var arrVOFFSET = -3;		// [** new **] arrow vertical offset (not ns4/op5/op6)
var arrVALIGN = "middle";	// [** new **] arrow vertical align (not ns4/op5/op6)

var arrLEFT = "<";		// [** new **] left arrow (not ns4/op5/op6)
var arrRIGHT = ">";		// [** new **] right arrow (not ns4/op5/op6)



//** LINKS ***********************************************************


// add main link item ("url","Link name",width,"text-alignment","_target","alt text",top position,left position,"key trigger","mCOLOR","rCOLOR","aLINK","aHOVER") [** last four are new **]
addMainItem("index.htm","Home",80,"center","","",0,0,"","#ffffff","#388b8c","#000000","#000000");

	// define submenu properties (width,"align to edge","text-alignment",v offset,h offset,"filter","smCOLOR","srCOLOR","sbCOLOR","shCOLOR","saLINK","saHOVER") [** last six are new **]
	defineSubmenuProperties(120,"left","left",-4,0,"","#ffddaa","#eeeeee","#660000","#eebbbb","#660000","#770033");

	
addMainItem("","Products",90,"center","","",0,0,"","","","","");

	defineSubmenuProperties(180,"left","left",-4,0,"","","","","","","");

	addSubmenuItem("pumps.htm","Pumps","_self","");
	addSubmenuItem("plateheat.htm","Plate Heat Exchangers","","");
	addSubmenuItem("evaporators.htm","Evaporators","","");
	addSubmenuItem("spraydryer.htm","Spray Dryers","","");
	addSubmenuItem("tanks.htm","Tanks","","");
	addSubmenuItem("bcooler.htm","Bulk Cooler","","");

	

addMainItem("","Projects",90,"center","","",0,0,"","","","","");
	defineSubmenuProperties(180,"left","left",-4,0,"","","","","","","");
addSubmenuItem("refrigeration.htm","Refrigeration Equipments","_self","");
	addSubmenuItem("dairy.htm","Dairy Equipments","","");
	addSubmenuItem("bevarage.htm","Beverage Equipment","","");
	addSubmenuItem("chemical.htm","Chemical Equipments","","");
	addSubmenuItem("icecream.htm","Ice Cream Equipments","","");
	
	
addMainItem("downloads.htm","Downloads",100,"center","","",0,0,"","","","","");
	defineSubmenuProperties(120,"left","center",-4,0,"","","","","","","");


	
addMainItem("news.htm","News",100,"center","","",0,0,"","","","","");
	defineSubmenuProperties(120,"left","center",-4,0,"","","","","","","");


addMainItem("gallery.htm","Image Gallery",105,"center","","",0,0,"","","","","");

	defineSubmenuProperties(130,"left","right",-4,0,"","","","","","","");



addMainItem("contactus.htm","Contact Us",90,"center","","",0,0,"","","","","");

	defineSubmenuProperties(130,"left","right",-4,0,"","","","","","","");


//**DO NOT EDIT THIS *****
}//***********************
//************************
