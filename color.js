self.toRGBA=function(f){function e(e,d,c){return String.fromCharCode(f.charCodeAt(e)*f.charCodeAt(d%a)%c+45)}f=f.trim().toLowerCase();var a=f.length,d=Math,t=f[0],n=0,u=(/\(([^\)]+)/.exec(f.replace(/([\d.]+)%/g,function(f,e){return n++>3||"h"==t?e/100:2.55*e}))||[0,""])[1].split(/[,\s]+/);if(/(^#?[a-f\d]+$)|\d/.test(f))return"h"==t?(h=parseInt(u[0])%360/60,s=u[1],l=u[2],c=s-s*d.abs(2*l-1),x=c-c*d.abs(h%2-1),m=l-c/2,r=0,g=0,b=0,h<1?(r=c,g=x):h<2?(r=x,g=c):h<3?(g=c,b=x):h<4?(g=x,b=c):h<5?(r=x,b=c):
(r=c,b=x),[255*(r+m),255*(g+m),255*(b+m)].map(d.round).concat([u[3]||1])):"r"==t?[+u[0],+u[1],+u[2],+u[3]||1]:(f=f.replace("#","").replace(6>a&&/./g,"$&$&")+"ff",[(z=+("0x"+f.substr(0,6)))>>16&255,z>>8&255,255&z,+("0x"+f.substr(6,2))/255]);var A=",45f5f5f5,T.f0f8ff,N:faebd7,dj0ff,>:7fffd4,Ngf0ffff,UFf5f5dc,gLffe4c4,yg000,Srffebcd,3L00f,3P8a2be2,c9a52a2a,WSdeb887,Unea7e5d,z}5f9ea0,B67fff00,z8d2691e,a@ff7f50,oA6495ed,.@fff8dc,^Rdc143c,4[0ff,EL00008b,E[008b8b,_3b8860b,EOa9a9a9,9i006400,EAa9a9a9,1}bdb76b,_Z8b008b,UP556b2f,9Wff8c00,q\\9932cc,Ux8b0000,yme9967a,;t8fbc8f,AL483d8b,A02f4f4f,Ax2f4f4f,S600ced1,gP9400d3,;pff1493,[v00bfff,_K696969,_x696969,gA1e90ff,5~b22222,/Hfffaf0,7x228b22,Krf0f,P?dcdcdc,vkf8f8ff,P7ffd700,_Qdaa520,=O808080,tx008000,t3adff2f,=A808080,mpf0fff0,1nff69b4,1fcd5c5c,8k4b0082,8Sfffff0,\\1f0e68c,kie6e6fa,unfff0f5,up7cfc00,M6fffacd,/=add8e6,9@f08080,uLe0ffff,AQfafad2,KLd3d3d3,/x90ee90,KId3d3d3,yWffb6c1,k4ffa07a,mI20b2aa,SL87cefa,}N789,}{789,}6b0c4de,/4ffffe0,Eb0f0,ub32cd32,utfaf0e6,B7f0f,?6800000,Bt66cdaa,[A0000cd,vWba55d3,vP9370db,\\b3cb371,y}7b68ee,vi00fa9a,y[48d1cc,yfc71585,xL191970,v[f5fffa,BIffe4e1,Z:ffe4b5,a\\ffdead,7/000080,=4fdf5e6,8D808000,ch6b8e23,hIffa500,K0ff4500,KWda70d6,e3eee8aa,AP98fb98,Q6afeeee,;xdb7093,1\\ffefd5,G>ffdab9,{gcd853f,Opffc0cb,Wcdda0dd,WAb0e0e6,{P800080,aA663399,/ff00,yvbc8f8f,O\\4169e1,QL8b4513,C6fa8072,d9f4a460,bt2e8b57,bYfff5ee,0[a0522d,uic0c0c0,Qz87ceeb,bj6a5acd,fK708090,f0708090,C9fffafa,Rm00ff7f,bL4682b4,_[d2b48c,u?008080,eYd8bfd8,/8ff6347,?n0000,u|40e0d0,y:ee82ee,\\0f5deb3,Lkfff,^9ff0,~P9acd32",
o=A.indexOf(","+e(0,17,82)+e(a-2,47,83));return 0>o?!1:self.toRGBA(/[^,]+/.exec(A.substring(o+3))[0])};