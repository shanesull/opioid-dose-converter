"use client";

import { useState, useEffect } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, HelpCircle, ArrowLeftRight } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const opioids = [
	{ name: "Alfentanil", routes: ["SC"] },
	{ name: "Buprenorphine", routes: ["Transdermal"] },
	{ name: "Codeine", routes: ["PO"] },
	{ name: "Fentanyl", routes: ["Transdermal", "SC"] },
	{ name: "Hydromorphone", routes: ["PO", "SC"] },
	{ name: "Morphine", routes: ["PO", "SC"] },
	{ name: "Oxycodone", routes: ["PO", "SC"] },
	{ name: "Tramadol", routes: ["PO"] },
];

// Define types for the conversion ratios
type OpioidRoute = string;
type ConversionValue =
	| number
	| string
	| {
			[key: string | number]: string | number;
			fallbackRatio?: number;
	  };

interface ConversionRatios {
	[key: OpioidRoute]: {
		[key: OpioidRoute]: ConversionValue;
	};
}

const opioidUnits = {
	"Morphine PO": "mg",
	"Morphine SC": "mg",
	"Oxycodone PO": "mg",
	"Oxycodone SC": "mg",
	"Hydromorphone PO": "mg",
	"Hydromorphone SC": "mg",
	"Fentanyl Transdermal": "mcg/hour",
	"Fentanyl SC": "mcg",
	"Alfentanil SC": "mg",
	"Buprenorphine Transdermal": "mcg/hour",
	"Tramadol PO": "mg",
	"Codeine PO": "mg",
};

const conversionRatios: ConversionRatios = {
	"Morphine PO": {
		"Morphine SC": 0.5,
		"Oxycodone PO": 0.5,
		"Oxycodone SC": 0.25,
		"Hydromorphone PO": 0.13,
		"Hydromorphone SC": 0.06,
		"Fentanyl Transdermal": {
			15: "6mcg/hour",
			30: "12mcg/hour",
			60: "25mcg/hour",
			120: "50mcg/hour",
			180: "75mcg/hour",
			fallbackRatio: 5 / 12,
		},
		"Fentanyl SC": 50 / 5,
		"Alfentanil SC": 0.3 / 5,
		"Buprenorphine Transdermal": 5 / 10,
		"Tramadol PO": 10,
		"Codeine PO": 10,
	},
	"Morphine SC": {
		"Morphine PO": 2,
		"Oxycodone PO": 1,
		"Oxycodone SC": 0.5,
		"Hydromorphone PO": 0.25,
		"Hydromorphone SC": 0.13,
		"Fentanyl Transdermal": {
			7.5: "6mcg/hour",
			15: "12mcg/hour",
			30: "25mcg/hour",
			60: "50mcg/hour",
			90: "75mcg/hour",
			fallbackRatio: 5 / 6,
		},
		"Fentanyl SC": 100 / 10,
		"Alfentanil SC": 0.3 / 10,
		"Buprenorphine Transdermal": 10 / 20,
		"Tramadol PO": 20,
		"Codeine PO": 20,
	},
	"Oxycodone PO": {
		"Morphine PO": 2,
		"Morphine SC": 2,
		"Oxycodone SC": 0.5,
		"Hydromorphone PO": 0.13 / 0.5,
		"Hydromorphone SC": 0.06 / 0.5,
		"Fentanyl Transdermal": "n/a", // No low-dose product
		"Fentanyl SC": 50 / 10, // 50mcg for 10mg Oxycodone PO
		"Alfentanil SC": 0.3 / 10, // 0.3mg for 10mg Oxycodone PO
		"Buprenorphine Transdermal": 5 / 10,
		"Tramadol PO": 10,
		"Codeine PO": 10,
	},
	"Oxycodone SC": {
		"Morphine PO": 4,
		"Morphine SC": 2,
		"Oxycodone PO": 2,
		"Hydromorphone PO": 0.13 / 2.5,
		"Hydromorphone SC": 0.06 / 2.5,
		"Fentanyl Transdermal": "n/a", // No low-dose product
		"Fentanyl SC": 100 / 5,
		"Alfentanil SC": 0.3 / 5,
		"Buprenorphine Transdermal": 10 / 5,
		"Tramadol PO": 20,
		"Codeine PO": 20,
	},
	"Hydromorphone PO": {
		"Morphine PO": 8,
		"Morphine SC": 4,
		"Oxycodone PO": 2,
		"Oxycodone SC": 1,
		"Hydromorphone SC": 0.5,
		"Fentanyl Transdermal": "n/a", // No low-dose product
		"Fentanyl SC": 100 / 4,
		"Alfentanil SC": 0.3 / 4,
		"Buprenorphine Transdermal": 10 / 4,
		"Tramadol PO": 40, // 200mg Tramadol for 5mg Hydromorphone PO
		"Codeine PO": 40, // 200mg Codeine for 5mg Hydromorphone PO
	},
	"Hydromorphone SC": {
		"Morphine PO": 16,
		"Morphine SC": 8,
		"Oxycodone PO": 4,
		"Oxycodone SC": 2,
		"Hydromorphone PO": 2,
		"Fentanyl Transdermal": "n/a", // No low-dose product
		"Fentanyl SC": 100 / 6, // 200mcg for 6mg Hydromorphone SC
		"Alfentanil SC": 0.3 / 6,
		"Buprenorphine Transdermal": 10 / 6,
		"Tramadol PO": 60, // 300mg Tramadol for 6mg Hydromorphone SC
		"Codeine PO": 60, // 300mg Codeine for 6mg Hydromorphone SC
	},
	"Fentanyl Transdermal": {
		"Morphine PO": {
			"6mcg/hour": 15,
			"12mcg/hour": 30,
			"25mcg/hour": 60,
			"50mcg/hour": 120,
			"75mcg/hour": 180,
			fallbackRatio: 12 / 5,
		},
		"Morphine SC": {
			"6mcg/hour": 7.5,
			"12mcg/hour": 15,
			"25mcg/hour": 30,
			"50mcg/hour": 60,
			"75mcg/hour": 90,
			fallbackRatio: 6 / 5,
		},
		"Oxycodone PO": 7.5 / 6, // 100mcg Fentanyl SC = 5mg Oxycodone PO
		"Oxycodone SC": 3.75 / 6, // 100mcg Fentanyl SC = 2.5mg Oxycodone SC
		"Hydromorphone PO": 2 / 6, // 100mcg Fentanyl SC = 1.3mg Hydromorphone PO
		"Hydromorphone SC": 1 / 6, // 100mcg Fentanyl SC = 0.6mg Hydromorphone SC
		"Alfentanil SC": 0.5 / 6, // 100mcg Fentanyl SC = 0.3mg Alfentanil SC
		"Buprenorphine Transdermal": 35 / 25, // No direct equivalent
		"Tramadol PO": 150 / 6, // 100mcg Fentanyl SC = 50mg Tramadol PO
		"Codeine PO": 150 / 6, // 100mcg Fentanyl SC = 50mg Codeine PO
	},
	"Fentanyl SC": {
		"Morphine PO": 0.1,
		"Morphine SC": 0.05, // 100mcg Fentanyl SC = 5mg Morphine SC
		"Oxycodone PO": 5 / 100, // 100mcg Fentanyl SC = 5mg Oxycodone PO
		"Oxycodone SC": 2.5 / 100, // 100mcg Fentanyl SC = 2.5mg Oxycodone SC
		"Hydromorphone PO": 1.3 / 100, // 100mcg Fentanyl SC = 1.3mg Hydromorphone PO
		"Hydromorphone SC": 0.6 / 100, // 100mcg Fentanyl SC = 0.6mg Hydromorphone SC
		"Fentanyl Transdermal": 0.04,
		"Alfentanil SC": 0.3 / 100, // 100mcg Fentanyl SC = 0.3mg Alfentanil SC
		"Buprenorphine Transdermal": 0.02, // No direct equivalent
		"Tramadol PO": 1, // 100mcg Fentanyl SC = 50mg Tramadol PO
		"Codeine PO": 1, // 100mcg Fentanyl SC = 50mg Codeine PO
	},
	"Alfentanil SC": {
		"Morphine PO": 30,
		"Morphine SC": 5,
		"Oxycodone PO": 5,
		"Oxycodone SC": 2.5,
		"Hydromorphone PO": 1.25,
		"Hydromorphone SC": 0.6,
		"Fentanyl Transdermal": "n/a",
		"Fentanyl SC": 50,
		"Buprenorphine Transdermal": 5,
		"Tramadol PO": 50,
		"Codeine PO": 50,
	},
	"Buprenorphine Transdermal": {
		"Morphine PO": 2,
		"Morphine SC": 1,
		"Oxycodone PO": 1,
		"Oxycodone SC": 0.5,
		"Hydromorphone PO": 1.3 / 5,
		"Hydromorphone SC": 0.6 / 5,
		"Fentanyl Transdermal": 25 / 35,
		"Fentanyl SC": 20,
		"Alfentanil SC": 0.3 / 5,
		"Tramadol PO": 20,
		"Codeine PO": 20,
	},
	"Tramadol PO": {
		"Morphine PO": 0.1,
		"Morphine SC": 0.05,
		"Oxycodone PO": 0.05,
		"Oxycodone SC": 0.025,
		"Hydromorphone PO": 1.3 / 100,
		"Hydromorphone SC": 0.6 / 100,
		"Fentanyl Transdermal": 6 / 150, // No direct equivalent
		"Fentanyl SC": 1,
		"Alfentanil SC": 0.3 / 100,
		"Buprenorphine Transdermal": 0.05, // No direct equivalent
		"Codeine PO": 1, // Equivalent to Codeine conversion
	},
	"Codeine PO": {
		"Morphine PO": 0.1,
		"Morphine SC": 0.05,
		"Oxycodone PO": 0.05,
		"Oxycodone SC": 0.025,
		"Hydromorphone PO": 1.3 / 100,
		"Hydromorphone SC": 0.6 / 100,
		"Fentanyl Transdermal": 6 / 150, // No direct equivalent
		"Fentanyl SC": 1,
		"Alfentanil SC": 0.3 / 100,
		"Buprenorphine Transdermal": 0.05, // No direct equivalent
		"Codeine PO": 1, // Equivalent to Codeine conversion
	},
};

export default function Component() {
	const [fromDrug, setFromDrug] = useState("");
	const [fromRoute, setFromRoute] = useState("");
	const [fromDose, setFromDose] = useState("");
	const [toDrug, setToDrug] = useState("");
	const [toRoute, setToRoute] = useState("");
	const [convertedDose, setConvertedDose] = useState("");
	const [error, setError] = useState("");
	const [warning, setWarning] = useState("");
	const [reductionPercentage, setReductionPercentage] = useState("30");
	const [reducedDose, setReducedDose] = useState("");
	const [usingFallback, setUsingFallback] = useState(false);

	const handleConvert = () => {
		setError("");
		setWarning("");
		setConvertedDose("");
		setReducedDose("");
		setUsingFallback(false);

		if (!fromDrug || !fromRoute || !toDrug || !toRoute || !fromDose) {
			return;
		}

		const fromKey = `${fromDrug} ${fromRoute}`;
		const toKey = `${toDrug} ${toRoute}`;

		const dose = parseFloat(fromDose);
		if (Number.isNaN(dose)) {
			return;
		}

		if (
			conversionRatios[fromKey] &&
			conversionRatios[fromKey][toKey] !== undefined
		) {
			if (typeof conversionRatios[fromKey][toKey] === "object") {
				const specificConversions = conversionRatios[fromKey][toKey];
				const exactMatch = specificConversions[dose];
				if (exactMatch) {
					setConvertedDose(exactMatch.toString());
				} else {
					const fallbackRatio = specificConversions.fallbackRatio;
					if (fallbackRatio) {
						const result = dose * fallbackRatio;
						setConvertedDose(result.toFixed(2));
						setWarning(
							"This conversion uses a fallback ratio. The exact product may not be available. Please consult with a healthcare professional.",
						);
						setUsingFallback(true);
					} else {
						const closestDose = Object.keys(specificConversions)
							.filter((key) => key !== "fallbackRatio")
							.map(Number)
							.reduce((a, b) =>
								Math.abs(b - dose) < Math.abs(a - dose) ? b : a,
							);
						setConvertedDose(specificConversions[closestDose]);
						setWarning(
							"No exact match found. Using the closest available dose. Please consult with a healthcare professional.",
						);
					}
				}
			} else {
				const ratio = conversionRatios[fromKey][toKey];
				const result = dose * ratio;
				setConvertedDose(result.toFixed(2));
			}
		} else if (fromKey === toKey) {
			setConvertedDose(fromDose);
		} else {
			// Use a general fallback ratio when no direct conversion is available
			const generalFallbackRatio = 1; // You may want to adjust this value
			const result = dose * generalFallbackRatio;
			setConvertedDose(result.toFixed(2));
			setWarning(
				"This conversion uses a general fallback ratio. The product may not be available or the conversion may not be accurate. Please consult with a healthcare professional.",
			);
			setUsingFallback(true);
		}
	};

	const handleSwap = () => {
		setFromDrug(toDrug);
		setFromRoute(toRoute);
		setToDrug(fromDrug);
		setToRoute(fromRoute);
		setFromDose("");
		setConvertedDose("");
		setReducedDose("");
		setError("");
		setWarning("");
		setUsingFallback(false);
	};

	useEffect(() => {
		if (fromDrug && fromRoute && toDrug && toRoute && fromDose) {
			handleConvert();
		} else {
			setConvertedDose("");
			setReducedDose("");
			setError("");
			setWarning("");
			setUsingFallback(false);
		}
	}, [fromDrug, fromRoute, toDrug, toRoute, fromDose]);

	useEffect(() => {
		if (convertedDose) {
			const parsedDose = parseFloat(convertedDose);
			if (!isNaN(parsedDose)) {
				const reduced =
					parsedDose * (1 - parseFloat(reductionPercentage) / 100);
				setReducedDose(reduced.toFixed(2));
			} else {
				setReducedDose("");
			}
		} else {
			setReducedDose("");
		}
	}, [convertedDose, reductionPercentage]);

	const displayConvertedDose = () => {
		if (convertedDose.includes("mcg/hour")) {
			return convertedDose;
		} else {
			return `${convertedDose} ${opioidUnits[`${toDrug} ${toRoute}`] || ""}`;
		}
	};

	return (
		<TooltipProvider>
			<div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
				<h1 className="text-2xl font-bold mb-6 text-center">
					Opioid Dose Converter
				</h1>
				<div className="space-y-6">
					<div className="space-y-4 p-4 bg-gray-50 rounded-md">
						<h2 className="text-lg font-semibold">From</h2>
						<div className="space-y-2">
							<Label htmlFor="from-drug" className="flex items-center">
								Drug
								<Tooltip>
									<TooltipTrigger>
										<HelpCircle className="h-4 w-4 ml-2" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Select the current opioid medication</p>
									</TooltipContent>
								</Tooltip>
							</Label>
							<Select value={fromDrug} onValueChange={setFromDrug}>
								<SelectTrigger id="from-drug" className="bg-white">
									<SelectValue placeholder="Select drug" />
								</SelectTrigger>
								<SelectContent>
									{opioids.map((opioid) => (
										<SelectItem key={opioid.name} value={opioid.name}>
											{opioid.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="from-route" className="flex items-center">
								Route
								<Tooltip>
									<TooltipTrigger>
										<HelpCircle className="h-4 w-4 ml-2" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Select the current administration route</p>
									</TooltipContent>
								</Tooltip>
							</Label>
							<Select value={fromRoute} onValueChange={setFromRoute}>
								<SelectTrigger id="from-route" className="bg-white">
									<SelectValue placeholder="Select route" />
								</SelectTrigger>
								<SelectContent>
									{opioids
										.find((o) => o.name === fromDrug)
										?.routes.map((route) => (
											<SelectItem key={route} value={route}>
												{route}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="from-dose" className="flex items-center">
								Dose
								<Tooltip>
									<TooltipTrigger>
										<HelpCircle className="h-4 w-4 ml-2" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Enter the current dose</p>
									</TooltipContent>
								</Tooltip>
							</Label>
							<div className="flex space-x-2">
								<Input
									id="from-dose"
									type="number"
									inputMode="decimal"
									pattern="[0-9]*\.?[0-9]*"
									value={fromDose}
									onChange={(e) => setFromDose(e.target.value)}
									placeholder="Enter dose"
									className="flex-grow bg-white"
								/>
								<span className="flex items-center px-3 rounded-md bg-gray-100">
									{opioidUnits[`${fromDrug} ${fromRoute}`] || ""}
								</span>
							</div>
						</div>
					</div>
					<div className="flex justify-center">
						<Button
							onClick={handleSwap}
							variant="outline"
							className="flex items-center"
						>
							<ArrowLeftRight className="mr-2 h-4 w-4" />
							Swap
						</Button>
					</div>
					<div className="space-y-4 p-4 bg-gray-50 rounded-md">
						<h2 className="text-lg font-semibold">To</h2>
						<div className="space-y-2">
							<Label htmlFor="to-drug" className="flex items-center">
								Drug
								<Tooltip>
									<TooltipTrigger>
										<HelpCircle className="h-4 w-4 ml-2" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Select the target opioid medication</p>
									</TooltipContent>
								</Tooltip>
							</Label>
							<Select value={toDrug} onValueChange={setToDrug}>
								<SelectTrigger id="to-drug" className="bg-white">
									<SelectValue placeholder="Select drug" />
								</SelectTrigger>
								<SelectContent>
									{opioids.map((opioid) => (
										<SelectItem key={opioid.name} value={opioid.name}>
											{opioid.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="to-route" className="flex items-center">
								Route
								<Tooltip>
									<TooltipTrigger>
										<HelpCircle className="h-4 w-4 ml-2" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Select the target administration route</p>
									</TooltipContent>
								</Tooltip>
							</Label>
							<Select value={toRoute} onValueChange={setToRoute}>
								<SelectTrigger id="to-route" className="bg-white">
									<SelectValue placeholder="Select route" />
								</SelectTrigger>
								<SelectContent>
									{opioids
										.find((o) => o.name === toDrug)
										?.routes.map((route) => (
											<SelectItem key={route} value={route}>
												{route}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					</div>
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					{warning && (
						<Alert variant="warning">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Warning</AlertTitle>
							<AlertDescription>{warning}</AlertDescription>
						</Alert>
					)}
					{convertedDose && (
						<div
							className={`p-4 rounded-md ${usingFallback ? "bg-orange-100" : "bg-green-100"}`}
						>
							<Alert>
								<AlertTitle>Converted Dose</AlertTitle>
								<AlertDescription className="text-lg font-semibold">
									{displayConvertedDose()}
								</AlertDescription>
							</Alert>
						</div>
					)}
					{convertedDose && (
						<div className="space-y-4 p-4 bg-gray-50 rounded-md">
							<h2 className="text-lg font-semibold">Reduced Dose</h2>
							<div className="space-y-2">
								<Label
									htmlFor="reduction-percentage"
									className="flex items-center"
								>
									Reduction Percentage
									<Tooltip>
										<TooltipTrigger>
											<HelpCircle className="h-4 w-4 ml-2" />
										</TooltipTrigger>
										<TooltipContent>
											<p>Select the percentage to reduce the converted dose</p>
										</TooltipContent>
									</Tooltip>
								</Label>
								<Select
									value={reductionPercentage}
									onValueChange={setReductionPercentage}
								>
									<SelectTrigger id="reduction-percentage" className="bg-white">
										<SelectValue placeholder="Select percentage" />
									</SelectTrigger>
									<SelectContent>
										{[25, 30, 35, 40, 45, 50].map((percent) => (
											<SelectItem key={percent} value={percent.toString()}>
												{percent}%
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Alert>
								<AlertTitle>Reduced Dose</AlertTitle>
								<AlertDescription>
									{reducedDose} {opioidUnits[`${toDrug} ${toRoute}`] || ""}
								</AlertDescription>
							</Alert>
						</div>
					)}
				</div>
				<p className="mt-6 text-sm text-gray-500">
					GOLDEN RULE: When changing from one opioid to another, always convert
					to Morphine PO first.
				</p>
			</div>
		</TooltipProvider>
	);
}
