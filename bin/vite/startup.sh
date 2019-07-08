gvite=$1
if [ ! $gvite ]; then 
    gvite="gvite"
fi

./kill.sh


./${gvite} --pprof > gvite.log