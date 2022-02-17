import React,{useState,useEffect} from 'react';
import './OrderSummary.scss';
import {Container,Row,Col, Image, Accordion,Card,Button} from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import {MdLocalShipping} from 'react-icons/md';
import {FaMoneyCheck} from 'react-icons/fa'
import { Formik, Form, Field } from 'formik';
import InputMask from 'react-input-mask';
import * as Yup from 'yup';
import axios from "axios";
import {useHistory} from "react-router-dom";
import {FiEdit} from 'react-icons/fi';
import {showAlert, cryptoCart} from 'src/app/store';
import {useDispatch} from "react-redux";
import PhoneNumberInput from 'src/app/components/third-party/phone-number-input/PhoneNumberInput';
// crypto_cart
function OrderSummary() {
	const dispatch = useDispatch();
	const[switcher,setSwitcher] = useState(false);
	const[countries,setCountries] = useState<any | null>([]);
	const[frontCart,setFrontCart]= useState<null | any >([]);
	const[checkReferral,setCheckReferral] = useState<null | any>(false);
	const[checkReferralOptional,setCheckReferralOptional] = useState<null | any>(false);
	const[checkUsername,setcheckUsername] = useState<null | any>(false);
	const[referral_user_id,setReferralUserId] = useState<null | any>('');
	const[isvalid,setIsValid]  = useState('0');
	const[isvalidRefferal,setIsValidisvalidRefferal]  = useState('0');
	const[isvalidOptional,setIsValidOptional]  = useState('0');
	const[loading,setLoading] = useState<null | any>(false);
	const baseurl = process.env.REACT_APP_API_END_POINT;
	// get current login user id here
	let login_user_id:any =  sessionStorage.getItem('browserKeys') || '{}';

	if(login_user_id == '{}'){
		login_user_id = 0;
	}else{
		let decrypted = CryptoJS.AES.decrypt(login_user_id, "Secret Passphrase");
		let decrypted_login_user_id= decrypted.toString(CryptoJS.enc.Utf8);
		login_user_id = JSON.parse(decrypted_login_user_id);

	}

	// get current login user id here
	const history = useHistory();
	const [permanentUser, setPermanentUser] = useState(false);
	const getCountries = () =>{
		axios.get(baseurl+'/country_list')
			.then(function (response) {
				// handle success
				if(response.status === 200){
					setCountries(response.data.country)
				}

			})
			.catch(function (error) {
				// handle error
				console.log(error);
			})
	}
	useEffect(()=>{
		getCountries();
		let get_cartItems = JSON.parse(localStorage.getItem('crypto_cart') || '[]');
		get_cartItems.length !==0 && setFrontCart(get_cartItems);
	},[]);
	const ValidationFields = Yup.object().shape({
		referrer_id: Yup.string(),

		first_name: Yup.string()
			.max(50, 'Too Long!')
			.required('First Name is required'),

		last_name: Yup.string()
			.max(50, 'Too Long!')
			.required('Last Name is required'),

		email: Yup.string()
			.max(50, 'Too Long!')
			.required('Email is required'),
		street_address: Yup.string().required('Address is required'),
		city:Yup.string().required('City is required'),
		state: Yup.string().required('State is required'),
		post_code: Yup.string().required('Zip Code is required'),
		country:Yup.string().required('Country is required'),
		mobile: Yup.string().required('Number is required'),
		cardNumber:switcher ? Yup.string().required('Card Number is required'):Yup.string(),
		cvv:switcher ? Yup.string().required('Cvv is required'):Yup.string(),
		expiry:switcher ? Yup.string().required('Expiry Date is Required') : Yup.string(),
		referrer_username:permanentUser ? Yup.string().required('Referral Name is Required') : Yup.string(),
		user_name:permanentUser ? Yup.string().required('User Name is Required') : Yup.string(),
		password:permanentUser ? Yup.string().required('Password is required').min(8,'Password at least have 8 characters').max(20,'Password Maximum have 20 characters'):Yup.string(),
		con_password:permanentUser ? Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match'):Yup.string(),

	});

	const getPermanentSubscription = (e: any) => {
		const target = e.target;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		setPermanentUser(value);
		setCheckReferral(false);
		setcheckUsername(false);
	}
	// for calculate price or subtotal of a order
	const itemsPrice = frontCart.reduce((index, value) => index + value.qty * value.price, 0);
	// for calculate tax 10.25 percent on a sub total of a order
	let tax = (10.25/100) * itemsPrice;
	let shippingCharges = sessionStorage.getItem('shippingCharges');
	const guestUserData = (values) =>{
		setLoading(true);
		let cart:any;
		// user payment Detail
		let paymentDetail = {
			'payment': {
				'cardNumber': values.cardNumber,
				'cardExpiry': values.expiry,
				'cardCsv': values.cvv,
			},
		}

		// user Order  Detail
		let order = {
			'order': {
				'subtotal': itemsPrice,
				'total': parseInt(itemsPrice) + parseInt(String(shippingCharges)) + parseInt(String(tax))
			},
		}
		// Guest user  Detail
		let user = {
			'user':{
				first_name: values.first_name,
				last_name:values.last_name,
				email:values.email,
				street_address:values.street_address,
				city:values.city,
				state:values.state,
				country:values.country,
				post_code:values.post_code,
				mobile:values.mobile,
				referrer_id:permanentUser ? referral_user_id : referral_user_id ? referral_user_id:'',
				user_name:permanentUser ? values.user_name: '',
				password:permanentUser ? values.password: ''
			}
		}

		let cartProduct = JSON.parse(localStorage.getItem('crypto_cart') || '{}');
		cart = cartProduct;
		axios.post(baseurl+'/guest_register', {
			checkout: JSON.stringify(cart),
			user_id:login_user_id,
			order:JSON.stringify(order),
			user:JSON.stringify(user),
			payment:JSON.stringify(paymentDetail),

		},).then(function (response) {
			setLoading(false);
			if(response.status === 200 && response.data.message){
				dispatch(cryptoCart(''));
				history.push('/crypto/thank-you');
				localStorage.removeItem('crypto_cart');
				dispatch(showAlert({
					message:'Thanks for your order!' ,
					messageType: 'success',
					showAlertMessage: true
				}));

			}
		}).catch(function (err){
			setLoading(false);
			if (err.response.status === 500) {
				dispatch(showAlert({
					// message: error.response.statusText +'  ' + 'please check your provided information',
					message: 'Please check your provided information and try few moments later',
					messageType: 'error',
					showAlertMessage: true
				}));
			}
			console.log(err,'err is define here')
		})
	}

	const CheckReferal = (user_name:any,optional:any)=>{

		if(!user_name){
			console.log('Empty Case One')
		}else{
			axios.post(baseurl+'/check_username_exit', {
				username: user_name,

			})
				.then(function (response) {
					// for redirct to Login after success
					if(response.status === 200 && response.data.message){
						optional === true ? setCheckReferralOptional(false):setCheckReferral(false);
						setReferralUserId(response.data.message);
						optional != true ? setIsValidisvalidRefferal('1'):setIsValidOptional('1');
					}

				})
				.catch(function (error) {
					if(error.response.status === 400){
						optional === true ? setCheckReferralOptional(true):setCheckReferral(true);
						optional != true ? setIsValidisvalidRefferal('2'):setIsValidOptional('2');
					}
				});
		}

	}
	const CheckUsername = (user_name:any)=>{
		if(!user_name){

			console.log('Empty Case Two')
		}else{
			axios.post(baseurl+'/check_username_exit', {
				username: user_name,

			})
				.then(function (response) {
					// for redirct to Login after success
					if(response.status === 200 && response.data.message){
						setcheckUsername(true);
						setIsValid('2');
					}

				})
				.catch(function (error) {
					if(error.response.status === 400){
						setIsValid('1');
						setcheckUsername(false);

					}
				});
		}

	}
	return (
		<section className="section" id="orderSummary">
			<Container>
				<Row>
					<Col lg={7} className="accordian">
						<Accordion defaultActiveKey="0">
							<Formik
								initialValues={{
									referrer_id: '',
									first_name: '',
									last_name: '',
									mobile: '',
									email:'',
									street_address: '',
									state: '',
									country:'',
									city:'',
									post_code:'',
									cardNumber:'',
									cvv:'',
									expiry:'',
									referrer_username:'',
									user_name:'',
									password:'',
									con_password:''


								}}
								validationSchema={ValidationFields}
								onSubmit={values => {
									guestUserData(values);

								}}
							>
								{({dirty,handleBlur, submitForm, errors, touched , validateForm, handleChange,values,isValidating,isValid,setFieldValue }) => (
									<Form>
										<Card>
											<Card.Header> <MdLocalShipping/> Shipping Address </Card.Header>
											<Card.Body>
												<Row>

													{


															!permanentUser &&
															<Col lg={6}>
																<div className="form-group">
																	<label >Referral Name (Optional)</label>
																	<Field
																		type="text"
																		placeholder="Referral Name (Optional)"
																		className={"form-control" + " " + (isvalidOptional === '1' ? 'is-valid':  isvalidOptional === '2' ? 'is-invalid' :'')}
																		name="referrer_id"
																		onBlur={e => {
																			// call the built-in handleBur
																			handleBlur(e)
																			// and do something about e
																			let user_name = e.currentTarget.value;
																			CheckReferal(user_name,true);
																		}}
																	/>
																	<div className="text-danger font-weight-lighter"> <b>{errors.referrer_id && touched.referrer_id ? errors.referrer_id : null}</b> </div>
																	{
																		checkReferralOptional &&
																		<div className="text-danger font-weight-lighter"><b>referral not matched</b></div>
																	}
																</div>
															</Col>

													}
													<Col lg={6}>
														<div className="form-group">
															<label >First Name</label>
															<Field type="text" placeholder="First Name" className="form-control" name="first_name"/>
															<div className="text-danger font-weight-lighter"> <b>{errors.first_name && touched.first_name ? errors.first_name : null }</b> </div>
														</div>
													</Col>
													<Col lg={6}>
														<div className="form-group">
															<label >Last Name</label>
															<Field type="text" placeholder="Last Name" className="form-control" name="last_name"/>
															{/* <Field type="text" placeholder="Last Name" className={`form-control ${(errors.last_name && touched.last_name) ? 'is-invalid':(!errors.last_name && touched.last_name)?'is-valid':''}`} name="last_name"/> */}
															<div className="text-danger font-weight-lighter"> <b>{errors.last_name && touched.last_name ? errors.last_name : null }</b> </div>
														</div>
													</Col>
													<Col lg={6}>
													<div className="form-group">
														<label >Mobile Number</label>
														{/* <Field type="text" placeholder="Mobile Number" className="form-control" name="phone"/> */}
														<PhoneNumberInput
															isInternationalCode={true}
															setValue={setFieldValue}
															isFormik={true}
															defaultCountry={'US'}
														/>
														{/* <div className="text-danger font-weight-lighter"> <b>{errors.phone && touched.phone ? errors.phone : null }</b> </div> */}
																					
													</div>
												</Col>

													<Col lg={6}>
														<div className="form-group">
															<label >Email</label>
															<Field type="email" placeholder="Email" className="form-control" name="email"/>
															<div className="text-danger font-weight-lighter"> <b>{errors.email && touched.email ? errors.email : null }</b> </div>
														</div>
													</Col>



													<Col lg={12}>
														<div className="form-group">
															<label >Street Address</label>
															<Field component="textarea" rows="3" type="text" placeholder="Your Address" className="form-control" name="street_address"/>
															<div className="text-danger font-weight-lighter"> <b>{errors.street_address && touched.street_address ? errors.street_address : null }</b> </div>
														</div>
													</Col>

													{/*country */}

													<Col lg={6}>
														<div className="form-group m-0">
															<label >Country</label>
															<Field name="country" as="select" className="custom-select">
																<option selected>Select your Country</option>
																{
																	countries.length !== 0 ?
																		countries.map((country, index) => (
																			<option key={country.id} value={country.country_name}>
																				{country.country_name}
																			</option>
																		))

																		:
																		'Loading ....'
																}
															</Field>
														</div>
														<div className="text-danger font-weight-lighter"> <b>{errors.country && touched.country ? errors.country : null }</b> </div>
													</Col>
													{/*state*/}
													<Col lg={6}>
														<div className="form-group">
															<label >State</label>
															<Field type="text" placeholder="State" className="form-control" name="state"/>
															<div className="text-danger font-weight-lighter"> <b>{errors.state && touched.state ? errors.state : null }</b> </div>
														</div>
													</Col>
													{/* city */}
													<Col lg={6}>
														<div className="form-group">
															<label >City</label>
															<Field type="text" placeholder="City" className="form-control" name="city"/>
															<div className="text-danger font-weight-lighter"> <b>{errors.city && touched.city ? errors.city : null }</b> </div>
														</div>
													</Col>
													{/*state */}
													<Col lg={6}>
														<div className="form-group">
															<label >Postal Code</label>
															<Field type="text" placeholder="Postal Code" className="form-control" name="post_code"/>
															<div className="text-danger font-weight-lighter"> <b>{errors.post_code && touched.post_code ? errors.post_code : null }</b> </div>
														</div>
													</Col>


													{/*<Col lg={12}>*/}
													{/*	<div className="form-group mt-4">*/}
													{/*		<div className="form-check">*/}
													{/*			<input className="form-check-input"*/}
													{/*				   type="checkbox"*/}
													{/*				   id="gridCheck"*/}
													{/*				   onChange={(e) => getPermanentSubscription(e)}*/}
													{/*			/>*/}
													{/*			<label className="form-check-label" htmlFor="gridCheck">*/}
													{/*				permanent user (optional)*/}
													{/*			</label>*/}
													{/*		</div>*/}
													{/*	</div>*/}
													{/*</Col>*/}
													{
														permanentUser &&
														<>
															<Col lg={6}>
																<div className="form-group">
																	<label>Referral User Name</label>
																	<Field type="text"
																		   placeholder="Referral User Name"
																		   className={"form-control" + " " + (isvalidRefferal === '1' ? 'is-valid':  isvalidRefferal === '2' ? 'is-invalid' :'')}
																		   name="referrer_username"
																		   onBlur={e => {
																			   // call the built-in handleBur
																			   handleBlur(e)
																			   // and do something about e
																			   let user_name = e.currentTarget.value;
																			   CheckReferal(user_name,false);
																		   }}
																	/>

																	<div className="text-danger font-weight-lighter"> <b>{errors.referrer_username && touched.referrer_username ? errors.referrer_username : null }</b> </div>

																	{
																		checkReferral &&
																		<div className="text-danger font-weight-lighter"><b>referral not matched</b></div>
																	}
																</div>
															</Col>
															<Col lg={6}>
																<div className="form-group">
																	<label>User Name</label>
																	<Field
																		type="text"
																		placeholder="User Name"
																		className={"form-control" + " " + (isvalid === '1' ? 'is-valid':  isvalid === '2' ? 'is-invalid' :'')}
																		name="user_name"
																		onBlur={e => {
																			// call the built-in handleBur
																			handleBlur(e)
																			// and do something about e
																			let user_name = e.currentTarget.value;
																			CheckUsername(user_name);
																		}}
																	/>
																	<div className="text-danger font-weight-lighter"> <b>{errors.user_name && touched.user_name ? errors.user_name : null}</b> </div>
																	{
																		checkUsername &&
																		<div className="text-danger font-weight-lighter">
																			<b>user name already exist...</b>
																		</div>
																	}
																</div>
															</Col>
														</>
													}
													{
														permanentUser &&
															<>

																<Col lg={6}>
																	<div className="form-group">
																		<label>Password</label>
																		<Field
																			type="password"
																			placeholder="Password"
																			className={"form-control"}
																			name="password"
																		/>
																		<div className="text-danger font-weight-lighter"> <b>{errors.password && touched.password ? errors.password : null}</b> </div>
																	</div>
																</Col>
																<Col lg={6}>
																	<div className="form-group">
																		<label>Confirm Password</label>
																		<Field
																			type="password"
																			placeholder="Confirm Password"
																			className={"form-control"}
																			name="con_password"
																		/>
																		<div className="text-danger font-weight-lighter"> <b>{errors.con_password && touched.con_password ? errors.con_password : null}</b> </div>
																	</div>
																</Col>
															</>
													}
													<Col lg={6}>
														<div className="form-group mt-4">
															<button type="button" className="btn btn-dark btn-block" onClick={()=> setSwitcher( true)} disabled={!(isValid && dirty)} >Continue</button>
														</div>
													</Col>
												</Row>
											</Card.Body>
										</Card>
										<Card className="mt-3">
											<Card.Header> <FaMoneyCheck/>Payment Process </Card.Header>
											<Accordion.Collapse eventKey="1" id={"test_of_element"} style={{ display: switcher ? 'block' : 'none' }}  >
												<Card.Body>
													<div className="payment-card">
														<div className="payment-header align-items-center d-flex justify-content-between">
															<h6>Credit Card/ Debit Card</h6>
															<div className="card-icons">
																<Image src="/img/visa.png" width="50px"/>
																<Image src="/img/paypal.png" width="50px"/>
																<Image src="/img/master.png" width="50px"/>
															</div>
														</div>
														<hr></hr>
														<div className="payment-body mt-4">
															<Row>
																<Col lg={6}>
																	<div className="form-group">
																		<label >Card Number</label>
																		<InputMask
																			mask='9999-9999-9999-9999'
																			onChange={handleChange}
																		>
																			{() =>
																				<Field placeholder="**** **** **** ****" type="text" className="form-control" name="cardNumber"/>
																			}
																		</InputMask>
																		<div className="text-danger font-weight-lighter"> <b>{errors.cardNumber && touched.cardNumber ? errors.cardNumber : null }</b> </div>
																	</div>
																</Col>
																<Col lg={6}>
																	<div className="form-group">
																		<label >Cvv</label>
																		<InputMask
																			mask='999'
																			onChange={handleChange}
																		>
																			{() =>
																				<Field  className="form-control"  placeholder="000" name="cvv"/>
																			}
																		</InputMask>

																		<div className="text-danger font-weight-lighter"> <b>{errors.cvv && touched.cvv ? errors.cvv : null }</b> </div>
																	</div>
																</Col>
																<Col lg={6}>
																	<div className="form-group">
																		<label >Expiration Date</label>
																		<InputMask
																			mask='99/9999'
																			onChange={handleChange}
																		>
																			{() =>
																				<Field placeholder="01/2023" className="form-control" name="expiry"/>
																			}
																		</InputMask>
																		<div className="text-danger font-weight-lighter"> <b>{errors.expiry && touched.expiry ? errors.expiry : null }</b> </div>
																	</div>
																</Col>

																<Col lg={6}>
																	<button
																		type="submit"
																		className="btn primaryButton d-block mx-auto f-16 mt-30 btn-block"
																	>
																		{
																			loading ? <div className="spinner-border text-light"></div>:'Submit'
																		}
																	</button>
																</Col>
															</Row>

														</div>
													</div>
												</Card.Body>
											</Accordion.Collapse>
										</Card>
									</Form>

								)}
							</Formik>
						</Accordion>
					</Col>
					<Col lg={5}>
						<div className="summary-card pf-10">
							<div className="summary-head d-flex justify-content-between align-items-center pb-3 pt-2">
								<h6 className="m-0">Order Summary</h6>
								<NavLink className="m-0 text-dark f-20" exact to="/crypto/cart"><FiEdit/></NavLink>
							</div>
							<div className="summary-body">
								<p className="my-3">{frontCart.length > 0 && frontCart.length} Items</p>

								{
									frontCart.length > 0 &&  frontCart.map((item)=>
										<div className="d-flex justify-content-between  py-3 item" key={item.id}>
											<div className="detail-summary d-flex justify-content-between">
												{
													item.app_iamges ?
														item?.app_iamges.map((imgs) =>
															<Image src={imgs.image_path} width="40px" height="40px"></Image>
														): <Image width="40px" height="40px" src={item.category ==='apparels'? '/img/placeholder.png': '/img/peace-coin-150-min.gif'}></Image>

												}



												{/*app_iamges*/}
												<div className="ml-3">
													<p className="f-12 m-0">{item.title}</p>
													{/*<small className="text-muted f-12">Size UK 6 - 8 / EUR 34 - 36</small>*/}
												</div>
											</div>
											<div>
												<p>${item.price}</p>
											</div>
										</div>


									)

								}

							</div>
							<div className="List-summary my-3">
								<div className="d-flex justify-content-between ">
									<p className="font-weight-lighter">SubTotal</p>
									<p>${itemsPrice}</p>
								</div>
								<div className="d-flex justify-content-between">
									<p className="font-weight-lighter">Shipping</p>
									<p >${shippingCharges}</p>
								</div>
								<div className="d-flex justify-content-between">
									<p className="font-weight-lighter">Tax</p>
									<p>${tax.toFixed(2)}</p>
								</div>
							</div>

							<div className="summary-footer d-flex justify-content-between pt-3 pb-2">
								<p>Total </p>
								<p>${parseInt(itemsPrice) + parseInt(String(shippingCharges)) + parseInt(String(tax))}</p>
							</div>


						</div>
					</Col>
				</Row>
			</Container>

		</section>
	)
}

export default OrderSummary
