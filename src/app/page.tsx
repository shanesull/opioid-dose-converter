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
import { AlertCircle, HelpCircle } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const opioids = [
	{ name: "Morphine", routes: ["PO", "SC"] },
	{ name: "Oxycodone", routes: ["PO", "SC"] },
	{ name: "Hydromorphone", routes: ["PO", "SC"] },
	{ name: "Fentanyl", routes: ["Transdermal", "SC"] },
	{ name: "Alfentanil", routes: ["SC"] },
	{ name: "Buprenorphine", routes: ["Transdermal"] },
	{ name: "Tramadol", routes: ["PO"] },
	{ name: "Codeine", routes: ["PO"] },
];

// Define types for the conversion ratios
type OpioidRoute = string;
type ConversionValue = number | string | { [dose: number]: string };

interface ConversionRatios {
	[key: OpioidRoute]: {
		[key: OpioidRoute]: ConversionValue;
	};
}

const conversionRatios: ConversionRatios = {
	"Morphine PO": {
		"Morphine SC": 0.5,
		"Oxycodone PO": 0.5,
		"Oxycodone SC": 0.25,
		"Hydromorphone PO": 0.13,
		"Hydromorphone SC": 0.06,
		"Fentanyl Transdermal": "n/a", // No low-dose product
		"Fentanyl SC": 50 / 5, // 50mcg for 5mg Morphine PO
		"Alfentanil SC": 0.3 / 5, // 0.3mg for 5mg Morphine PO
		"Buprenorphine Transdermal": 5 / 10, // 5mcg/hour for 10mg Morphine PO
		"Tramadol PO": 10, // 50mg Tramadol for 5mg Morphine PO
		"Codeine PO": 10, // 50mg Codeine for 5mg Morphine PO
	},
	"Morphine SC": {
		"Morphine PO": 2,
		"Oxycodone PO": 1,
		"Oxycodone SC": 0.5,
		"Hydromorphone PO": 0.25,
		"Hydromorphone SC": 0.13,
		"Fentanyl Transdermal": "n/a", // No low-dose product
		"Fentanyl SC": 100 / 10, // 100mcg for 10mg Morphine SC
		"Alfentanil SC": 0.3 / 10, // 0.3mg for 10mg Morphine SC
		"Buprenorphine Transdermal": 10 / 20, // 10mcg/hour for 20mg Morphine SC
		"Tramadol PO": 20, // 100mg Tramadol for 10mg Morphine SC
		"Codeine PO": 20, // 100mg Codeine for 10mg Morphine SC
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
			6: "n/a", // No product
			12: "25mcg/hour", // 25mcg/hour patch equivalent to ~60mg Morphine PO
			25: "50mcg/hour", // 50mcg/hour patch equivalent to ~120mg Morphine PO
			50: "75mcg/hour", // 75mcg/hour patch equivalent to ~180mg Morphine PO
			75: "100mcg/hour", // 100mcg/hour patch equivalent to ~240mg Morphine PO
			100: "n/a", // No product beyond 100mcg/hour
		},
		"Morphine SC": {
			6: "n/a", // No product
			12: "25mcg/hour", // 25mcg/hour patch equivalent to ~60mg Morphine SC
			25: "50mcg/hour", // 50mcg/hour patch equivalent to ~120mg Morphine SC
			50: "75mcg/hour", // 75mcg/hour patch equivalent to ~180mg Morphine SC
			75: "n/a", // No higher dose product
			100: "n/a",
		},
	},
	"Fentanyl SC": {
		"Morphine PO": 2,
		"Morphine SC": 1,
		"Oxycodone PO": 0.5,
		"Oxycodone SC": 0.25,
		"Hydromorphone PO": 0.1,
		"Hydromorphone SC": 0.05,
		"Fentanyl Transdermal": "n/a", // No direct equivalent
		"Alfentanil SC": 0.01,
		"Buprenorphine Transdermal": "n/a", // No direct equivalent
		"Tramadol PO": 0.02,
		"Codeine PO": 0.02,
	},
	"Alfentanil SC": {
		"Morphine PO": 10,
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
		"Morphine PO": 10,
		"Morphine SC": 5,
		"Oxycodone PO": 5,
		"Oxycodone SC": 2.5,
		"Hydromorphone PO": 1.25,
		"Hydromorphone SC": 0.6,
		"Fentanyl Transdermal": "n/a",
		"Fentanyl SC": 50,
		"Alfentanil SC": 0.01,
		"Tramadol PO": 50,
		"Codeine PO": 50,
	},
	"Tramadol PO": {
		"Morphine PO": 0.1,
		"Morphine SC": 0.05,
		"Oxycodone PO": 0.05,
		"Oxycodone SC": 0.025,
		"Hydromorphone PO": 0.01,
		"Hydromorphone SC": 0.005,
		"Fentanyl Transdermal": "n/a", // No direct equivalent
		"Fentanyl SC": 0.005,
		"Alfentanil SC": 0.01,
		"Buprenorphine Transdermal": "n/a", // No direct equivalent
		"Codeine PO": 1, // Equivalent to Codeine conversion
	},
	"Codeine PO": {
		"Morphine PO": 0.1,
		"Morphine SC": 0.05,
		"Oxycodone PO": 0.05,
		"Oxycodone SC": 0.025,
		"Hydromorphone PO": 0.01,
		"Hydromorphone SC": 0.005,
		"Fentanyl Transdermal": "n/a",
		"Fentanyl SC": 0.005,
		"Alfentanil SC": 0.01,
		"Buprenorphine Transdermal": "n/a", // No direct equivalent
		"Tramadol PO": 1,
	},
};

export default function Component() {
	const [fromDrug, setFromDrug] = useState("");
	const [fromRoute, setFromRoute] = useState("");
	const [fromDose, setFromDose] = useState("");
	const [fromUnit, setFromUnit] = useState("mg");
	const [toDrug, setToDrug] = useState("");
	const [toRoute, setToRoute] = useState("");
	const [convertedDose, setConvertedDose] = useState("");
	const [error, setError] = useState("");
	const [reductionPercentage, setReductionPercentage] = useState("30");
	const [reducedDose, setReducedDose] = useState("");

	const handleConvert = () => {
		setError("");
		setConvertedDose("");
		setReducedDose("");

		if (!fromDrug || !fromRoute || !toDrug || !toRoute || !fromDose) {
			setError("Please fill in all fields");
			return;
		}

		const fromKey = `${fromDrug} ${fromRoute}`;
		const toKey = `${toDrug} ${toRoute}`;

		let dose = parseFloat(fromDose);
		if (fromUnit === "mcg") {
			dose = dose / 1000; // Convert mcg to mg
		}

		if (
			fromKey in conversionRatios &&
			toKey in conversionRatios[fromKey as OpioidRoute]
		) {
			const conversion =
				conversionRatios[fromKey as OpioidRoute][toKey as OpioidRoute];

			if (fromKey === "Fentanyl Transdermal") {
				// Handle Fentanyl Transdermal conversion
				if (typeof conversion === "object" && !Array.isArray(conversion)) {
					const doseRanges = Object.keys(conversion)
						.map(Number)
						.sort((a, b) => a - b);
					const closestDose =
						doseRanges.find((d) => d >= dose) ||
						doseRanges[doseRanges.length - 1];
					const convertedPatch = conversion[closestDose];
					if (convertedPatch === "n/a") {
						setError(
							"No appropriate patch strength available for this conversion.",
						);
					} else {
						setConvertedDose(convertedPatch);
					}
				}
			} else if (conversion === "n/a") {
				setError("No product available for the given dose and conversion.");
			} else if (typeof conversion === "number") {
				const result = dose * conversion;
				setConvertedDose(result.toFixed(2));
			}
		} else if (fromKey === toKey) {
			setConvertedDose(fromDose);
		} else {
			setError(
				"Direct conversion not available. Please convert to Morphine PO first.",
			);
		}
	};

	useEffect(() => {
		if (convertedDose && convertedDose !== "n/a") {
			const reduced =
				parseFloat(convertedDose) * (1 - parseFloat(reductionPercentage) / 100);
			setReducedDose(reduced.toFixed(2));
		} else {
			setReducedDose("");
		}
	}, [convertedDose, reductionPercentage]);

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
							<Select onValueChange={setFromDrug}>
								<SelectTrigger id="from-drug">
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
							<Select onValueChange={setFromRoute}>
								<SelectTrigger id="from-route">
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
									value={fromDose}
									onChange={(e) => setFromDose(e.target.value)}
									placeholder="Enter dose"
									className="flex-grow"
								/>
								<Select value={fromUnit} onValueChange={setFromUnit}>
									<SelectTrigger className="w-[80px]">
										<SelectValue placeholder="Unit" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="mg">mg</SelectItem>
										<SelectItem value="mcg">mcg</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
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
							<Select onValueChange={setToDrug}>
								<SelectTrigger id="to-drug">
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
							<Select onValueChange={setToRoute}>
								<SelectTrigger id="to-route">
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
					<Button onClick={handleConvert} className="w-full">
						Convert
					</Button>
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					{convertedDose && (
						<Alert>
							<AlertTitle>Converted Dose</AlertTitle>
							<AlertDescription>
								{convertedDose}{" "}
								{toDrug === "Fentanyl" && toRoute === "Transdermal" ? "" : "mg"}
							</AlertDescription>
						</Alert>
					)}
					{convertedDose && convertedDose !== "n/a" && (
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
									<SelectTrigger id="reduction-percentage">
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
									{reducedDose}{" "}
									{toDrug === "Fentanyl" && toRoute === "Transdermal"
										? ""
										: "mg"}
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
