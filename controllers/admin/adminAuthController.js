
// // //  //  //   //  //          GET LOGIN Page    //  //  //  //  //  //  //
 const getAdminLogin = (req,res) => {    
  try {
    console.log(req.session)
   if(req.session.adminID) {                                                                          //if admin is already logged in
    res.redirect( '/admin/dashboard' )                                                                 //redirect to dashboard
  }else {
    res.render('admin/adminLogin',{message:undefined})
  }
  } catch (error) {
    console.log(error)
    resstatus(500).send('error')
  }
}

// // //  //  //   //  //          POST LOGIN     //  //  //  //  //  //  //

const postAdminLogin =  (req,res)=>{                                                       
  
  const {email,password}=req.body                                                                 //get email and password from request body  
  if(email===process.env.admin_Email && password === process.env.admin_Password){                   //if email and password are correct
    req.session.adminID=email                                                                      //set admin id in session  
    res.redirect('/admin/dashboard')                                                                //redirect to dashboard
  }else{
    res.render('admin/adminLogin',{message:"Invalid Email or Password"})
  }
}

// // //  //  //   //  //            LOGOUT       //  //  //  //  //  //  // 

const getLogout= (req,res) => {                                                      
  req.session.destroy((error)=>{
    if(error){
      console.log(error);    
    }else{
      res.redirect('/admin/login')
    }
  })
}

export default {
  getLogout,
  getAdminLogin,
  postAdminLogin
}