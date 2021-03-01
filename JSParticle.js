class particleImage
{
    constructor(){}

}

class traceList extends particleImage
{
    constructor(traces)
    {
        super();
        this.traces = traces;
    }

    tick(particle)
    {
        for(var i=0;i<this.traces.length;i++)
        {

            this.traces[i].tick(particle._PS.context, particle.Transform, particle);
        }
    }
}
class spriteSheet extends particleImage
{
    //constructor(img,  ncols = 1 , nrows = 1, maxSprites = 1,  frameWidth, frameHeight, timePerFrame=200, rotateFromCenter = true, autoplay = true )
    constructor(par)
    {
        super();
        this.img = par.img;
        this.maxSprites = par.maxSprites || 1;
        
        
        if(!par.frameWidth)
        {    console.error("set the frame width correctly");
            this.frameWidth = 0;
        }
        else
            this.frameWidth = par.frameWidth;
        

        if(!par.frameHeight)
        {    
            console.error("set the frame height correctly");
            this.frameHeight = 0;
        }
        else
            this.frameHeight = par.frameHeight;
            
        console.log(JSON.stringify(this.img));

//        console.log("img width: " +  this.img.width + " img height : " +this.img.height )

        this.ncols = par.ncols || 1;
        this.nrows = par.nrows || 1;
        

        this.rotateFromCenter = par.rotateFromCenter || true;
        this.autoplay = par.autoplay || true;
        this.loop = true;
        this.frameTime = par.frameTime || 200;
        this.currentSprite = par.curFrame || 0;
        this.maxTime = 1800;
        this.elapsed = 0;
    }

    setFrame(n)
    {
        this.currentSprite = n;
    }

    tick(particle)
    {
        if(this.autoplay)
            this.elapsed = particle.elapsed;
        
        
        
        var ctx = particle._PS.context;

        ctx.translate(particle.Transform.translation.getValue(particle.elapsed).x  , particle.Transform.translation.getValue(particle.elapsed).y);
        ctx.scale(particle.Transform.scale.getValue(particle.elapsed).x, particle.Transform.scale.getValue(particle.elapsed).y);
        ctx.rotate(particle.Transform.rotation.getValue(particle.elapsed));

        if(this.loop)
            this.currentSprite =  ( Math.floor( this.elapsed / this.frameTime )) % this.maxSprites;  
        else    
            this.currentSprite = Math.floor( this.elapsed / this.frameTime );

        
        ctx.drawImage(this.img,
            (this.currentSprite % this.ncols)*this.frameWidth,
            Math.floor(this.currentSprite / this.ncols)*this.frameHeight ,
            this.frameWidth, this.frameHeight  ,  this.rotateFromCenter?-this.frameWidth / 2:0, this.rotateFromCenter?-this.frameHeight / 2:0, this.frameWidth, this.frameHeight);//, 0, 0, this.frameWidth, this.frameHeight);
  
  //console.log("left :"  +(this.currentSprite % this.ncols)*this.frameWidth ) ;   
   
  // ctx.drawImage(this.img, 64, 64 , this.frameWidth, this.frameHeight,  this.rotateFromCenter?-this.frameWidth / 2:0, this.rotateFromCenter?-this.frameHeight / 2:0, this.frameWidth, this.frameHeight);//, 0, 0, this.frameWidth, this.frameHeight);
        
        //RESET
        ctx.setTransform(1, 0, 0, 1, 0, 0);

    }

}
class traceSheet extends particleImage {}


class timeline
{
    constructor(parameters)//values: array 
    {
        this.values = parameters.values;
        //this.initialTime = parameters.initialTime || 0;
        this.loop = parameters.loop || false;
        this.leftBorder=0;
        this.rightBorder=0;
        this.IOC=0; // INDEX OF NUMBER TO COMPARE
        this.N =  this.values.length;
        this.maxTime = this.values[this.N-1][0]; 
        this.lastT=-50;
        this.value = null;
    }

    copy(val)
    {
        this.value = val;

    }
    doLerp(leftIndex, t)
    {

        var t0 = leftIndex<0 ? 0 :this.values[leftIndex][0];

        var a = (t- t0) /(this.values[leftIndex+1][0] - t0);
          
        this.value =  JSMath.lerp( ( leftIndex < 0? 0 :this.values[leftIndex][1]) , this.values[leftIndex+1][1] ,a);      

    }


    getValue(t)
    {
        

        if(this.loop)
            t= t%this.maxTime;
        
        if(this.lastT == t)
            return this.value;

        this.lastT = t;

        var leftIndex = this.findIntervalBorderIndex(t);

        
        if(leftIndex == this.N-1)
        {   
            this.copy(this.values[leftIndex][1]); 
           
            return this.value;//final value in the loop
            
        }
        else
        {
            
            this.doLerp(leftIndex, t);

            return this.value;
        }
    
        //function to return a value at a time.
    
    
    }

    findIntervalBorderIndex = function (point, useRightBorder = false) {
        //If point is beyond given intervals
        if (point <  this.values[0][0])
          return -1
        if (point >  this.values[ this.N - 1][0])
          return  this.N - 1
        //If point is inside interval
        //Start searching on a full range of intervals

        this.leftBorder= 0;
        this.rightBorder = this.N - 1;
          //, leftBorderIndex = 0
          //, rightBorderIndex = intervals.length - 1
        //Reduce searching range till it find an interval point belongs to using binary search
        while (this.rightBorder - this.leftBorder !== 1) {
          this.IOC = this.leftBorder + Math.floor((this.rightBorder - this.leftBorder)/2)
          point >= this.values[this.IOC][0]
            ? this.leftBorder = this.IOC
            : this.rightBorder = this.IOC
        }
        return useRightBorder ? this.rightBorder : this.leftBorder
      }


}

class scalarTimeline extends timeline
{
    constructor(parameters)
    {
        //values =  matrix
        // [ [tn , vn],[tn+1, vn+1] ]
        //time0 < time1 <time2
        //
        
        super(parameters);
        this.value = 0 ;

    }



}

class vectorTimeline extends timeline
{
    constructor(parameters)
    {
        super(parameters);
        this.value = new Vector(0,0);
    }

    copy(val)
    {
        this.value.copyInto(val);

    }

    doLerp(leftIndex, t)
    {

        var t0 = leftIndex<0 ? 0 :this.values[leftIndex][0];

        var a = (t- t0) /(this.values[leftIndex+1][0] - t0);
      
        this.value.lerpInto( ( leftIndex < 0? Vector.Zero :this.values[leftIndex][1]) , this.values[leftIndex+1][1] , a);
    }


}



class variableWithTimeline
{
    constructor(val, dynamic, timeline)//both references if objects
    {
        this.val = val;
        this.dynamic = dynamic;
        this.timeline = timeline;
        

    }

    getValue(t)
    {
        //returns the sum of base and timeline.
        console.error("has to be implemented");
    }
    getbase()
    {
        //returns the base
        console.error("has to be implemented");
    }
    getTimelineValue(t)
    {
        //returns the timeline
        console.error("has to be implemented")
    }

}



//scalar
class scalarValue extends variableWithTimeline
{
    constructor(val,dynamic, timeline=null)
    {
        super(val, dynamic, timeline);
    }

    getValue(t = 0)
    {
        if(this.timeline)
        {
            this.val = this.dynamic + this.timeline.getValue(t);
        }
        else
        {
            this.val = this.dynamic;
        }
        return this.val;
    }
}

class vectorValue extends variableWithTimeline
{
    //VECTOR, VECTOR, TIMELINE
    constructor( val, dynamic, timeline = null)
    {
        super(val, dynamic, timeline);
    }

    getValue(t = 0)
    {
        if(this.timeline)
        {
            this.val.addInto(this.dynamic, this.timeline.getValue(t));
        }
        else
        {
            this.val.copyInto(this.dynamic);
        }

        return this.val;
    }

} 

class colorValue extends variableWithTimeline
{


}






/*RANGE GENERATORS*/

class vectorGenerator
{
    constructor()
    {
  
    }

    generate()
    {
        console.error("Please override me called from vector generator");
    }
}

class vectorRange extends vectorGenerator
{
    constructor(min, max)
    {
        
        super();
        this.min = min;
        this.max = max;

    }

    generate()
    {
        return Vector.getRandom(this.min, this.max);

    }


}

class vectorArcRange extends vectorGenerator
{
    constructor(arcStart, arcEnd, vStart, vEnd)
    {
        super();
        this.arcStart = arcStart ;
        this.arcEnd = arcEnd ;
        this.vStart = vStart;
        this.vEnd = vEnd;


    }

    generate()
    {
        var angle = JSMath.getRandom(this.arcStart, this.arcEnd);
        var speed =JSMath.getRandom(this.vStart, this.vEnd);
        return new Vector(speed*Math.cos(angle) , speed*Math.sin(angle));
    }

}

class vectorFunction
{
    constructor(f, param)
    {
        this.f = f;
        this.param = param;
    }

}



class scalarGenerator
{
    constructor()
    {
  
    }

    generate()
    {
        console.error("Please override me called from vector generator");
    }
}

class scalarRange extends scalarGenerator
{
    constructor(min,max)
    {
        super();
        this.min = min;
        this.max = max;
    }

    generate()
    {
        return JSMath.getRandom(this.min, this.max);
    }

}
class scalarFunction
{
    constructor(f,param)
    {
        this.f=f;
        this.param = param;
    }

}

class colorRange
{
    constructor(min, max)
    {
        this.min = min;
        this.max = max;
    }
    
    randomColorInRange()
    {
        var col1 = JSColor.hexToRGB(this.min);
        var col2 = JSColor.hexToRGB(this.max);
        var final = {r: JSMath.getRandom(col1.r, col2.r) ,g: JSMath.getRandom(col1.g, col2.g), b: JSMath.getRandom(col1.b, col2.b) };
        return "rgb("+ +final.r + "," + +final.g + "," + +final.b + ")";
    }

}

class colorFunction
{
    constructor(f, param)
    {
        this.f = f;
        this.param = param;
    }

}

class JSMath
{
    static getRandom(min, max)
    {
       return Math.random() * (max - min) + min;
    }
    static randomTranslation(min, max)
    {
        return Vector.getRandom(min,max);
    }

    static watchDelta (delta)
    {
        if(delta > 30)
            return 17;

        else
            return delta;    
    }
    static lerp(x,y,a)
    {
       return x * (1 - a) + y * a;
    }

}
class JSColor
{
    static  hexToRGB(h) {
        let r = 0, g = 0, b = 0;
      
        // 3 digits
        if (h.length == 4) {
          r = "0x" + h[1] + h[1];
          g = "0x" + h[2] + h[2];
          b = "0x" + h[3] + h[3];
      
        // 6 digits
        } else if (h.length == 7) {
          r = "0x" + h[1] + h[2];
          g = "0x" + h[3] + h[4];
          b = "0x" + h[5] + h[6];
        }
        
        //return "rgb("+ +r + "," + +g + "," + +b + ")";
        return {r:parseInt(r), g:parseInt(g), b:parseInt(b)};
    }

}
/*VECTOR*/

class Vector
{   
    static rotateVector(v, angle)
    {
        v.x = v.x*Math.cos(angle) - v.y*Math.sin(angle);
        v.y = v.x*Math.sin(angle) + v.y*Math.cos(angle);
    }
    static scaleVector(v, s)
    {
        v.x=v.x*s;
        v.y=v.y*s;

    }

    isZero()
    {
        return( x== 0 && y==0);
    }

    translateInto(v,w)
    {
        v.x=this.x + w.x;
        v.y=this.y + w.y;
    }

    rotateInto(v, angle)
    {
        v.x = this.x*Math.cos(angle) - this.y*Math.sin(angle);
        v.y = this.x*Math.sin(angle) + this.y*Math.cos(angle);

    }
    scaleInto(v, s)
    {
        v.x=this.x*s;
        v.y=this.y*s;
 

    }
    transformInto(v, Transform)
    {

        v.x = this.x*Math.cos(Transform.rotation) - this.y*Math.sin(Transform.rotation);
        v.y = this.x*Math.sin(Transform.rotation) + this.y*Math.cos(Transform.rotation);

        v.x=v.x*Transform.scale.x;
        v.y=v.y*Transform.scale.y;

       
        //v.x+= Transform.translation.getValue(0).x;
        //v.y+= Transform.translation.getValue(0).y;

        //console.log("test: " + Transform.translation.getValue().y );

        v.x+= Transform.translation.x;
        v.y+= Transform.translation.y;

    }

    transformIntoValues(v, Transform, elapsed)
    {
        //console.log("rotation value:" +Transform.rotation.getValue())

  

        v.x = this.x*Math.cos(Transform.rotation.getValue(elapsed)) - this.y*Math.sin(Transform.rotation.getValue(elapsed));
        v.y = this.x*Math.sin(Transform.rotation.getValue(elapsed)) + this.y*Math.cos(Transform.rotation.getValue(elapsed));

  
        v.x=v.x*Transform.scale.getValue(elapsed).x;
        v.y=v.y*Transform.scale.getValue(elapsed).y;
        


       
        //v.x+= Transform.translation.getValue(0).x;
        //v.y+= Transform.translation.getValue(0).y;

        //console.log("test: " + Transform.translation.getValue().y );

        v.x+= Transform.translation.getValue(elapsed).x;
        v.y+= Transform.translation.getValue(elapsed).y;

        
    }


    constructor(x=0,y=0)
    {
        this.x=x;
        this.y=y;

    }

    get width() {

		return this.x;

	}

	set width( value ) {

		this.x = value;

	}

	get height() {

		return this.y;

	}

	set height( value ) {

		this.y = value;

	}

	set( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	}

    add(v)
    {
        this.x += v.x;
        this.y += v.y;
    }
    addXY(x,y)
    {
        this.x += x;
        this.y += y;
    }

    addInto(v,w)
    {
        this.x = v.x + w.x;
        this.y = v.y + w.y;

    }
    copy()
    {
        return new Vector(this.x, this.y);

    }

    copyInto(v)
    {
        this.x = v.x;
        this.y = v.y;
    }
    static getRandom(min, max)
    {
        if(!min || !max)
        {
            console.error("min or max are not defined please correct your inputs");
            return new Vector(0,0);

        }

        if(min.x >max.x || min.y > max.y)
        {
            console.error("Trying to generate a random number with the wrong parameters, min is greater than max for example\n a Default vector has been created please correct the inputs")
            return new Vector(0,0)
        }

        return new Vector(
            JSMath.getRandom(min.x, max.x),
            JSMath.getRandom(min.y, max.y)
             );

    }

    lerpInto(v, w , a)
    {
        this.x = JSMath.lerp (v.x , w.x , a);
        this.y = JSMath.lerp (v.y , w.y ,a );
        //return x * (1 - a) + y * a;
    }
    
}
Vector.Zero = new Vector(0,0);

class TimeSeries
{
    constructor(parameters)//[time, scalar]
    {
        this.series = parameters.series||null;
        this.relative = parameters.relative || false;
        this.maxTime = parameters.maxTime ||0;
        this.looping = parameters.looping || false;

    }

}

class ScalarTimeSeries extends TimeSeries
{
    //relative, absolute, values, maxTime,looping
    constructor(parameters)//[time, scalar]
    {
        super(parameters);

    }

    getInterpolation(currentValue, currentTime)
    {

    }

}
class VectorTimeSeries extends TimeSeries
{
    constructor(parameters)//[time, vector]
    {
        super(parameters);


    }

}
class colorTimeSeries extends TimeSeries
{
    constructor(parameters)//[time, color]
    {
        super(parameters);

    }
}

class JSParticles
{
    constructor(parameters)
    {
        this._delta=0;
        this.elapsed=0;
        this.currTime = performance.now();
        this.parameters = parameters;
        this.maxParticles = parameters.maxParticles || 5;
     
        this.canvas     =       parameters.canvas || null;
        this.context = this.canvas.getContext('2d') || null;

        this.generationSpeed= parameters.generationSpeed || 5;
        this.generationAllowance = this.generationSpeed;

        this.particles = [];
        this.particleGlobalIndex = 0;
        
       
    }


    hasCanvas()
    {
        return (this.canvas != null);
    }
    hasContext()
    {
        return(this.context != null);
    }

    tick()
    {
        this._delta = performance.now() - this.currTime;

        this._delta = JSMath.watchDelta(this._delta);

        this.elapsed +=this._delta; 
        this.currTime = performance.now();

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  

        for(var i = 0 ; i < this.particles.length;i++)
        {
            //TODO
            this.particles[i].tick();
            
                
            if( this.particles[i].TTL != 0 && this.particles[i].elapsed >= this.particles[i].TTL)
            {

                this.particles[i]._PS = null;
                this.particles.splice(i, 1);
                
            }
        }


        while(this.particles.length < this.maxParticles && this.generationAllowance >1)
        {

            this.particleGlobalIndex++;
            this.particles.push( this._generateParticle(this.parameters, this.particles.length) );
            this.generationAllowance--;

               // console.log("created a new particle!");

        }

        this.generationAllowance+=this.generationSpeed*this._delta/1000;

        //console.log("number of particles " + this.particles.length);

    }

    _handleVectorValue(val, def, error="")
    {
        if(val)
        {
            
            if(val instanceof(Vector))
            {
                return val.copy(); 
            }
            else if(val instanceof(vectorGenerator))
            {
                return val.generate();
            }
            else if(val instanceof(vectorFunction))
            {
                val.param.context = this;

                return val.f(val.param);
                //TODO
                //return new Vector(0,0);
            }
            else{
                console.error(error);

            }
           
        }
        else{
            return def.copy();
        }


    }

    _handleScalarValue(val, def, error="")
    {
        if(val)
        {
            if(typeof(val) == 'number' )
            {
                return val;
            }
            else if(val instanceof scalarGenerator)
            {
                return val.generate();
            }
            else if(val instanceof scalarFunction)
            {
                console.error("not implemented yet");
                return def;
            }
            else{
                console.error(error);
            }

        }
        else {
          
            return def;
        }

    }
    _handleColorValue(val, def="#000000", error)
    {
        if(val)
        {
            if(typeof(val) == 'string' )
            {
                //requires a well formed color
                return val;
            }
            else if(val instanceof colorRange)
            {
                return val.randomColorInRange();
            }
            else if(val instanceof colorFunction)
            {
                return def;
            }
            else{
                console.error(error);
            }

        }
        else {
          
            return def;
        }

    }



  

    _generateParticle(parameters, arrayIndex)
    {            
        //
        var parametersParticle = {

        //ttl : this.parameters.ttl,
        TTL :  this._handleScalarValue(parameters.TTL, 0),
         
        elapsed: parameters.elapsed||0,
        
        velocity: this._handleVectorValue( parameters.initialVelocity , new Vector(0,0)),           
        
        angularSpeed : this._handleScalarValue(parameters.angularSpeed, 0 ,"ERROR WITH ANGULAR SPEED"),
        
        scaleVelocity: this._handleVectorValue( parameters.scaleVelocity , new Vector(0,0)),
        
        trace:parameters.trace,


        Transform:{
            translation :
            new vectorValue(new Vector(0,0), this._handleVectorValue( parameters.initialPosition , new Vector(0,0)), parameters.translationTimeline || null  ),
            rotation :
             new scalarValue(0 ,  this._handleScalarValue(parameters.initialRotation, 0) , parameters.rotationTimeline || null ), //this._handleScalarValue(this.parameters.initialRotation, 0),
            scale :
             new vectorValue(new Vector(0,0),this._handleVectorValue( parameters.initialScale , new Vector(1,1)) , parameters.scaleTimeline || null)
            //this.parameters.scale? parameters.scale.copy() : new Vector(1,1)
        },
        
        
        /*
        Transform:{
            translation : this._handleVectorValue( this.parameters.initialPosition , new Vector(0,0)),
            rotation :    this._handleScalarValue(this.parameters.initialRotation, 0),
            scale : this._handleVectorValue( this.parameters.initialScale , new Vector(1,1))
            },
        */    
        strokeStyle :parameters.strokeStyle || "#000000FF",

        fillStyle : this._handleColorValue(parameters.fillStyle,"#000000")


        };
        

        return new JSParticle(parametersParticle, this);
    }

}

class JSParticle
{

    constructor( parameters, particleSystem )
    {
        this._PS = particleSystem;
        this._delta = 0;
        this.TTL    =           parameters.TTL;
        this.elapsed=           parameters.elapsed || 0;
        this.velocity = parameters.velocity || new Vector(0,0);
        this.angularSpeed =  parameters.angularSpeed;
        this.scaleVelocity = parameters.scaleVelocity;
        this.trace = parameters.trace || null;
        this.creationTime = performance.now();
        this.currTime = performance.now();
        this.strokeStyle = parameters.strokeStyle || "#000000FF";
        this.fillStyle = parameters.fillStyle;

        this.timelineOffset = parameters.timelineOffset || 0;
        
        this.timeLineElapsed = 0;
        this.isPlaying = parameters.autoplay || true;
        


        this.Transform = parameters.Transform;
        
        /*{
            translation : parameters.translation || new Vector(0,0),
            rotation : parameters.rotation||0,
            scale : parameters.scale || new Vector(1,1)
        }*/

        
    }

    timelinePlay()
    {
        this.isPlaying = true;
    }
    timelineStop()
    {
        this.isPlaying = false;
    }

    timelineRewind()
    {
        this.timeLineElapsed =0;
    }
    timeLineSetTime(t)
    {
        this.timeLineElapsed = t;
    }


    updateTranslation()
    {

        this.Transform.translation.dynamic.addXY(this.velocity.x*this._delta/1000, this.velocity.y*this._delta/1000);
        
               
    }

    updateRotation()
    {
        this.Transform.rotation.dynamic +=(this.angularSpeed*this._delta/1000);

    }
    updateScale()
    {
        this.Transform.scale.dynamic.addXY(this.scaleVelocity.x*this._delta/1000, this.scaleVelocity.y*this._delta/1000);
    }

    updateTransforms()
    {
        this.updateTranslation();
        this.updateRotation();
        this.updateScale();


    }

    tick()
    {
        this._delta = performance.now() - this.currTime;

        this._delta = JSMath.watchDelta(this._delta);

        this.elapsed += this._delta; 

        if(this.isPlaying)
        {
            this.timeLineElapsed+= this._delta;
        }

        this.currTime = performance.now();

        this._PS.context.lineWidth = 10;


        if(this._PS.hasCanvas() && this._PS.hasContext())
        {

            this.updateTransforms();
        
           // console.log("this should be gaining speed" + JSON.stringify(this.Transform.translation.getValue()));

            /*DO THE DRAWING*/
            
            this.trace.tick(this);

            
            /*for(var i=0;i<this.trace.length;i++)
            {

                this.trace[i].tick(this._PS.context, this.Transform, this);
            }
            */

            //FILL TEST
            if(typeof (this.fillStyle) == 'function')
            {
                this._PS.context.fillStyle = this.fillStyle(this.elapsed);
                
            }
            else{
                    this._PS.context.fillStyle   = this.fillStyle;                
            }
            this._PS.context.fill();
            //END FILL


           //STROKE TEST            
            if(typeof (this.strokeStyle) == 'function')
            {
                this._PS.context.strokeStyle = this.strokeStyle(this.elapsed);
            }
            else{
                    this._PS.context.strokeStyle   = this.strokeStyle;                
            }

            this._PS.context.stroke();
            //END STROKE
             
           

        }

    }
    //type

}

class Trace 
{
    constructor()
    {
        this.base=[];
       // this.transformed=[];
        
    }

    _push(v)
    {
        this.base.push(v);
     //   this.transformed.push(v.copy());
    }
    
    
    recalculateAll(Transform, particle)
    {
        for(var i = 0 ; i < this.base.length;i++)
        {
            this.base[i].transformIntoValues(this.transformed[i], Transform , particle.timeLineElapsed + particle.timelineOffset);
            
        }
    }

    tick(ctx , Transform , particle)
    {
        //this.recalculateAll(Transform, particle);

        //ctx.scale(2, 2);

        ctx.translate(Transform.translation.getValue(particle.elapsed).x, Transform.translation.getValue(particle.elapsed).y);
        ctx.scale(Transform.scale.getValue(particle.elapsed).x, Transform.scale.getValue(particle.elapsed).y);
        ctx.rotate(Transform.rotation.getValue(particle.elapsed));
    
        this.draw(ctx);
    
        //RESET
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        
    }
    

}

class beginPath extends Trace
{
    constructor()
    {
        super();
    }

    draw(ctx)
    {
        ctx.beginPath();
    }
}
class closePath extends Trace
{
    constructor()
    {
        super();
    }

    draw(ctx)
    {
        ctx.closePath();
    }
}
class fill extends Trace
{
    constructor()
    {
        super();
    }
    
    draw(ctx)
    {
        ctx.fill();
    }
}
class stroke extends Trace
{
    constructor()
    {
        super();
    }

    draw(ctx)
    {
        ctx.stroke();
    }
}

class moveTo extends Trace
{
    constructor(x,y)
    {
        super();
        this._push(new Vector(x,y));

    }
    draw(ctx)
    {

        ctx.moveTo( this.base[0].x ,  this.base[0].y);
    }

}
class lineTo extends Trace
{
    constructor(x,y)
    {
        super();
        this._push(new Vector(x,y));

    }
    draw(ctx)
    {

        ctx.lineTo( this.base[0].x ,  this.base[0].y);
    }

}
class bezierCurveTrace extends Trace{}
class ArcTrace extends Trace{}

class quadraticCurveTrace extends Trace{}

class arc extends Trace
{
    constructor (x=0, y=0, radio=Math.PI/2, startAngle=0, endAngle=2*Math.PI, anticlockwise=false)
    {
        super();

        this._push(new Vector(x,y));
        this._push(radio);
        this._push(new Vector(startAngle,endAngle));
        this._push(anticlockwise);

    }
    draw(ctx)
    {
        ctx.arc (this.base[0].x, this.base[0].y, this.base[1], this.base[2].x, this.base[2].y, this.base[3]);

    }

}
class ellipse extends Trace
{
    constructor(x, y, radiusX, radiusY, rotation, startAngle, endAngle , anticlockwise = false)
    {
        super();
        this._push(new Vector(x,y));
        this._push(new Vector(radiusX, radiusY));
        this._push(rotation);
        this._push(new Vector(startAngle, endAngle));
        this._push(anticlockwise);
    }

    draw(ctx)
    {
        ctx.ellipse(this.base[0].x, this.base[0].y, this.base[1].x, this.base[1].y, this.base[2], this.base[3].x, this.base[3].y ,this.base[4]);

    }
}

//export { JSParticle, Vector, _moveTo,_lineTo,_beginPath, _closePath, _fill, _stroke };